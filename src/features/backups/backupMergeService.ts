import { checkSupabaseConnectivity } from '../../services/connectivity';
import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Attachment, AttachmentLink, MedicationAttachment, ProcedureAttachment, TopicAttachment } from '../../types/attachment';
import type { Json } from '../../types/database';
import type { Medication, MedicationTag } from '../../types/medication';
import type { ProcedureTag } from '../../types/procedure';
import type { Category, Folder, Tag, Topic, TopicRelation, TopicTag } from '../../types/topic';
import { syncAttachmentsFromSupabase } from '../attachments/attachmentRepository';
import { loadMedicationData } from '../medications/medicationRepository';
import { procedureFromSupabase, procedureToSupabase } from '../procedures/procedureMapper';
import { loadProcedureData } from '../procedures/procedureRepository';
import { loadTopicData } from '../topics/topicRepository';
import { getBackupFileBlob, parseValidatedBackupZip, type ParsedBackup } from './backupImportService';
import type { BackupData, BackupProfile } from './backupTypes';
import type { BackupMergePreview, BackupMergeResult, RestoreEntityName, RestoreEntitySummary, RestoreFileSummary, RestoreProgress } from './backupRestoreTypes';

const bucketName = 'study-attachments';

type TimestampedRecord = { id: string; user_id: string; created_at?: string; updated_at?: string };
type RelationRecord = { user_id: string; created_at?: string };
type CurrentData = BackupData;
type FilePlan = {
  attachment: Attachment;
  storagePath: string;
  blob: Blob | null;
  checksum: string | null;
  status: 'uploaded' | 'existing' | 'missing' | 'conflict' | 'failed' | 'not-needed';
  error?: string;
};

const entityNames: RestoreEntityName[] = [
  'profile',
  'folders',
  'categories',
  'tags',
  'topics',
  'topic_relations',
  'medications',
  'procedures',
  'attachments',
  'topic_tags',
  'medication_tags',
  'procedure_tags',
  'attachment_links',
  'topic_attachments',
  'medication_attachments',
  'procedure_attachments'
];

function emptyEntitySummary(): RestoreEntitySummary {
  return { created: 0, updated: 0, kept: 0, skipped: 0, conflicts: 0, errors: [] };
}

function emptyFileSummary(): RestoreFileSummary {
  return { uploaded: 0, existing: 0, missingInZip: 0, conflicts: 0, failed: 0, errors: [] };
}

function emptyEntityMap(): Record<RestoreEntityName, RestoreEntitySummary> {
  return entityNames.reduce(
    (map, name) => ({ ...map, [name]: emptyEntitySummary() }),
    {} as Record<RestoreEntityName, RestoreEntitySummary>
  );
}

function nowIso() {
  return new Date().toISOString();
}

function safeFileName(name: string) {
  const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
  return clean || 'archivo';
}

function extensionFromName(name: string) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index) : '';
}

function storagePathFor(userId: string, attachmentId: string, originalName: string) {
  const ext = extensionFromName(originalName);
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${userId}/${attachmentId}/${safeFileName(base)}${ext}`;
}

async function sha256(blob: Blob | string) {
  const buffer = typeof blob === 'string' ? new TextEncoder().encode(blob) : await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(',')}}`;
}

function comparableRecord(record: unknown) {
  if (!record || typeof record !== 'object') return record;
  const clone = { ...(record as Record<string, unknown>) };
  delete clone.user_id;
  delete clone.sync_status;
  delete clone.error_message;
  return clone;
}

function comparableAttachment(record: Attachment) {
  const clone = comparableRecord(record) as Record<string, unknown>;
  delete clone.storage_path;
  delete clone.thumbnail_path;
  return clone;
}

function backupIsNewer(backup?: string, current?: string) {
  if (!backup || !current) return false;
  return new Date(backup).getTime() > new Date(current).getTime();
}

function fileChecksumFor(parsed: ParsedBackup, attachmentId: string) {
  return parsed.manifest.files.find((item) => item.attachment_id === attachmentId)?.checksum ?? null;
}

async function ensureOnline() {
  const connection = await checkSupabaseConnectivity(3000);
  if (connection !== 'online') throw new Error('Necesitás conexión con Supabase para restaurar una copia.');
}

async function assertBackupOwner(parsed: ParsedBackup, userId: string) {
  if (parsed.manifest.exported_by_user_id !== userId) {
    throw new Error('Este respaldo fue creado por otro usuario. En esta versión no se permite restaurarlo.');
  }
}

async function fetchCurrentData(userId: string): Promise<CurrentData> {
  const [
    profileResult,
    foldersResult,
    categoriesResult,
    tagsResult,
    topicsResult,
    topicRelationsResult,
    topicTagsResult,
    medicationsResult,
    medicationTagsResult,
    proceduresResult,
    procedureTagsResult,
    attachmentsResult,
    attachmentLinksResult,
    topicAttachmentsResult,
    medicationAttachmentsResult,
    procedureAttachmentsResult
  ] = await Promise.all([
    supabase.from('profiles').select('user_id, display_name, created_at, updated_at').eq('user_id', userId).maybeSingle(),
    supabase.from('folders').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('topics').select('*').eq('user_id', userId),
    supabase.from('topic_relations').select('*').eq('user_id', userId),
    supabase.from('topic_tags').select('*').eq('user_id', userId),
    supabase.from('medications').select('*').eq('user_id', userId),
    supabase.from('medication_tags').select('*').eq('user_id', userId),
    supabase.from('procedures').select('*').eq('user_id', userId),
    supabase.from('procedure_tags').select('*').eq('user_id', userId),
    supabase.from('attachments').select('*').eq('user_id', userId),
    supabase.from('attachment_links').select('*').eq('user_id', userId),
    supabase.from('topic_attachments').select('*').eq('user_id', userId),
    supabase.from('medication_attachments').select('*').eq('user_id', userId),
    supabase.from('procedure_attachments').select('*').eq('user_id', userId)
  ]);

  const firstError =
    profileResult.error ??
    foldersResult.error ??
    categoriesResult.error ??
    tagsResult.error ??
    topicsResult.error ??
    topicRelationsResult.error ??
    topicTagsResult.error ??
    medicationsResult.error ??
    medicationTagsResult.error ??
    proceduresResult.error ??
    procedureTagsResult.error ??
    attachmentsResult.error ??
    attachmentLinksResult.error ??
    topicAttachmentsResult.error ??
    medicationAttachmentsResult.error ??
    procedureAttachmentsResult.error;
  if (firstError) throw firstError;

  return {
    profile: (profileResult.data as BackupProfile | null) ?? null,
    folders: (foldersResult.data ?? []) as Folder[],
    categories: (categoriesResult.data ?? []) as Category[],
    tags: (tagsResult.data ?? []) as Tag[],
    topics: (topicsResult.data ?? []) as Topic[],
    topic_relations: (topicRelationsResult.data ?? []) as TopicRelation[],
    topic_tags: (topicTagsResult.data ?? []) as TopicTag[],
    medications: (medicationsResult.data ?? []) as Medication[],
    medication_tags: (medicationTagsResult.data ?? []) as MedicationTag[],
    procedures: (proceduresResult.data ?? []).map((procedure) => procedureFromSupabase(procedure)),
    procedure_tags: (procedureTagsResult.data ?? []) as ProcedureTag[],
    attachments: (attachmentsResult.data ?? []) as Attachment[],
    attachment_links: (attachmentLinksResult.data ?? []) as AttachmentLink[],
    topic_attachments: (topicAttachmentsResult.data ?? []) as TopicAttachment[],
    medication_attachments: (medicationAttachmentsResult.data ?? []) as MedicationAttachment[],
    procedure_attachments: (procedureAttachmentsResult.data ?? []) as ProcedureAttachment[]
  };
}

function compareTimestamped<T extends TimestampedRecord>(
  name: RestoreEntityName,
  backupRows: T[],
  currentRows: T[],
  entities: Record<RestoreEntityName, RestoreEntitySummary>,
  comparable: (row: T) => unknown = comparableRecord
) {
  const currentById = new Map(currentRows.map((item) => [item.id, item]));
  backupRows.forEach((backup) => {
    const current = currentById.get(backup.id);
    if (!current) {
      entities[name].created += 1;
      return;
    }

    const same = stableStringify(comparable(backup)) === stableStringify(comparable(current));
    if (same) {
      entities[name].kept += 1;
      return;
    }

    if (backupIsNewer(backup.updated_at, current.updated_at)) {
      entities[name].updated += 1;
    } else {
      entities[name].skipped += 1;
    }
  });
}

function compareRelations<T extends RelationRecord>(
  name: RestoreEntityName,
  backupRows: T[],
  currentRows: T[],
  entities: Record<RestoreEntityName, RestoreEntitySummary>,
  keyFor: (row: T) => string,
  validReference: (row: T) => boolean
) {
  const currentKeys = new Set(currentRows.map(keyFor));
  backupRows.forEach((row) => {
    if (!validReference(row)) {
      entities[name].skipped += 1;
      entities[name].errors.push('Relación omitida por referencia faltante.');
      return;
    }
    if (currentKeys.has(keyFor(row))) {
      entities[name].kept += 1;
    } else {
      entities[name].created += 1;
    }
  });
}

function topicRelationKey(row: TopicRelation) {
  if (row.relation_type === 'related') {
    return ['related', ...[row.source_topic_id, row.target_topic_id].sort()].join(':');
  }
  return `${row.source_topic_id}:${row.target_topic_id}:${row.relation_type}`;
}

async function fileExistsWithChecksum(path: string, expectedChecksum: string | null): Promise<'missing' | 'same' | 'different'> {
  const { data, error } = await supabase.storage.from(bucketName).download(path);
  if (error || !data) return 'missing';
  if (!expectedChecksum) return 'same';
  return (await sha256(data)) === expectedChecksum ? 'same' : 'different';
}

async function compareFiles(parsed: ParsedBackup, userId: string, current: CurrentData) {
  const files = emptyFileSummary();
  const currentAttachments = new Map(current.attachments.map((item) => [item.id, item]));

  for (const attachment of parsed.data.attachments) {
    const checksum = fileChecksumFor(parsed, attachment.id);
    const storagePath = storagePathFor(userId, attachment.id, attachment.original_filename || attachment.filename);
    const hasZipFile = parsed.manifest.files.some((item) => item.attachment_id === attachment.id);
    if (!hasZipFile) {
      if (!currentAttachments.has(attachment.id)) files.missingInZip += 1;
      continue;
    }

    const state = await fileExistsWithChecksum(storagePath, checksum);
    if (state === 'same') files.existing += 1;
    if (state === 'missing') files.uploaded += 1;
    if (state === 'different') files.conflicts += 1;
  }

  return files;
}

function buildPreview(parsed: ParsedBackup, userId: string, current: CurrentData, files: RestoreFileSummary): BackupMergePreview {
  const entities = emptyEntityMap();
  const backup = parsed.data;
  const currentTagIds = new Set([...current.tags.map((item) => item.id), ...backup.tags.map((item) => item.id)]);
  const currentTopicIds = new Set([...current.topics.map((item) => item.id), ...backup.topics.map((item) => item.id)]);
  const currentMedicationIds = new Set([...current.medications.map((item) => item.id), ...backup.medications.map((item) => item.id)]);
  const currentProcedureIds = new Set([...current.procedures.map((item) => item.id), ...backup.procedures.map((item) => item.id)]);
  const currentAttachmentIds = new Set([...current.attachments.map((item) => item.id), ...backup.attachments.map((item) => item.id)]);

  if (backup.profile && current.profile) {
    const same = backup.profile.display_name === current.profile.display_name;
    if (same) entities.profile.kept = 1;
    else if (backupIsNewer(backup.profile.updated_at, current.profile.updated_at)) entities.profile.updated = 1;
    else entities.profile.skipped = 1;
  } else if (backup.profile && !current.profile) {
    entities.profile.skipped = 1;
    entities.profile.errors.push('El perfil actual no existe; no se restaurará status ni datos administrativos.');
  } else {
    entities.profile.kept = 1;
  }

  compareTimestamped('folders', backup.folders, current.folders, entities);
  compareTimestamped('categories', backup.categories, current.categories, entities);
  compareTimestamped('tags', backup.tags, current.tags, entities);
  compareTimestamped('topics', backup.topics, current.topics, entities);
  compareRelations(
    'topic_relations',
    backup.topic_relations,
    current.topic_relations,
    entities,
    topicRelationKey,
    (row) => row.source_topic_id !== row.target_topic_id && currentTopicIds.has(row.source_topic_id) && currentTopicIds.has(row.target_topic_id)
  );
  compareTimestamped('medications', backup.medications, current.medications, entities);
  compareTimestamped('procedures', backup.procedures, current.procedures, entities);
  compareTimestamped('attachments', backup.attachments, current.attachments, entities, comparableAttachment);
  compareRelations('topic_tags', backup.topic_tags, current.topic_tags, entities, (row) => `${row.topic_id}:${row.tag_id}`, (row) => currentTopicIds.has(row.topic_id) && currentTagIds.has(row.tag_id));
  compareRelations(
    'medication_tags',
    backup.medication_tags,
    current.medication_tags,
    entities,
    (row) => `${row.medication_id}:${row.tag_id}`,
    (row) => currentMedicationIds.has(row.medication_id) && currentTagIds.has(row.tag_id)
  );
  compareRelations(
    'procedure_tags',
    backup.procedure_tags,
    current.procedure_tags,
    entities,
    (row) => `${row.procedure_id}:${row.tag_id}`,
    (row) => currentProcedureIds.has(row.procedure_id) && currentTagIds.has(row.tag_id)
  );
  compareRelations(
    'attachment_links',
    backup.attachment_links,
    current.attachment_links,
    entities,
    (row) => `${row.attachment_id}:${row.owner_type}:${row.owner_id}`,
    (row) => currentAttachmentIds.has(row.attachment_id)
  );
  compareRelations(
    'topic_attachments',
    backup.topic_attachments,
    current.topic_attachments,
    entities,
    (row) => `${row.topic_id}:${row.attachment_id}`,
    (row) => currentTopicIds.has(row.topic_id) && currentAttachmentIds.has(row.attachment_id)
  );
  compareRelations(
    'medication_attachments',
    backup.medication_attachments,
    current.medication_attachments,
    entities,
    (row) => `${row.medication_id}:${row.attachment_id}`,
    (row) => currentMedicationIds.has(row.medication_id) && currentAttachmentIds.has(row.attachment_id)
  );
  compareRelations(
    'procedure_attachments',
    backup.procedure_attachments,
    current.procedure_attachments,
    entities,
    (row) => `${row.procedure_id}:${row.attachment_id}`,
    (row) => currentProcedureIds.has(row.procedure_id) && currentAttachmentIds.has(row.attachment_id)
  );

  const errors = [
    ...Object.values(entities).flatMap((summary) => summary.errors),
    ...files.errors
  ];
  const warnings = [
    ...parsed.manifest.warnings,
    ...(files.missingInZip > 0 ? [`${files.missingInZip} archivo(s) físicos faltan en el ZIP y se omitirán si no existen actualmente.`] : []),
    ...(files.conflicts > 0 ? [`${files.conflicts} archivo(s) ya existen en Storage pero con contenido distinto.`] : [])
  ];

  return {
    status: errors.length > 0 || files.conflicts > 0 ? 'ready-with-warnings' : 'ready',
    createdAt: parsed.manifest.created_at,
    exportedByUserId: parsed.manifest.exported_by_user_id,
    entities,
    files,
    warnings,
    errors
  };
}

export async function createMergePreview(file: File, userId: string): Promise<BackupMergePreview> {
  await ensureOnline();
  const parsed = await parseValidatedBackupZip(file);
  await assertBackupOwner(parsed, userId);
  const current = await fetchCurrentData(userId);
  const files = await compareFiles(parsed, userId, current);
  return buildPreview(parsed, userId, current, files);
}

function forcedUser<T extends { user_id: string }>(row: T, userId: string): T {
  return { ...row, user_id: userId };
}

function timestampedPayload<T extends TimestampedRecord>(backup: T, current: T | undefined, userId: string): T {
  return {
    ...backup,
    user_id: userId,
    created_at: current?.created_at ?? backup.created_at,
    updated_at: backup.updated_at ?? nowIso()
  };
}

function attachmentForRestore(attachment: Attachment, current: Attachment | undefined, userId: string, storagePath: string) {
  return {
    id: attachment.id,
    user_id: userId,
    filename: attachment.filename,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    size: attachment.size,
    width: attachment.width,
    height: attachment.height,
    storage_path: storagePath,
    thumbnail_path: null,
    created_at: current?.created_at ?? attachment.created_at,
    updated_at: attachment.updated_at ?? nowIso()
  };
}

function shouldUpsert<T extends TimestampedRecord>(
  backup: T,
  current: T | undefined,
  summary: RestoreEntitySummary,
  comparable: (row: T) => unknown = comparableRecord
) {
  if (!current) {
    summary.created += 1;
    return true;
  }
  const same = stableStringify(comparable(backup)) === stableStringify(comparable(current));
  if (same) {
    summary.kept += 1;
    return false;
  }
  if (backupIsNewer(backup.updated_at, current.updated_at)) {
    summary.updated += 1;
    return true;
  }
  summary.skipped += 1;
  return false;
}

async function upsertTimestamped<T extends TimestampedRecord>(
  name: RestoreEntityName,
  table: 'folders' | 'categories' | 'tags' | 'topics' | 'medications' | 'procedures' | 'attachments',
  backupRows: T[],
  currentRows: T[],
  userId: string,
  summary: RestoreEntitySummary,
  comparable?: (row: T) => unknown,
  transform?: (row: T) => Record<string, unknown>
) {
  const currentById = new Map(currentRows.map((item) => [item.id, item]));
  for (const backup of backupRows) {
    const current = currentById.get(backup.id);
    if (!shouldUpsert(backup, current, summary, comparable)) continue;
    const payload = transform ? transform(timestampedPayload(backup, current, userId)) : timestampedPayload(backup, current, userId);
    const { error } = await supabase.from(table).upsert(payload as never);
    if (error) {
      summary.errors.push(`${name} ${backup.id}: ${error.message}`);
      summary.skipped += 1;
      if (!current) summary.created = Math.max(0, summary.created - 1);
      if (current) summary.updated = Math.max(0, summary.updated - 1);
    }
  }
}

async function prepareFiles(parsed: ParsedBackup, userId: string, current: CurrentData, onProgress?: (progress: RestoreProgress) => void): Promise<Map<string, FilePlan>> {
  const currentById = new Map(current.attachments.map((item) => [item.id, item]));
  const plans = new Map<string, FilePlan>();
  let index = 0;

  for (const attachment of parsed.data.attachments) {
    index += 1;
    onProgress?.({ step: 'preparing-files', message: 'Preparando archivos físicos...', current: index, total: parsed.data.attachments.length });
    const storagePath = storagePathFor(userId, attachment.id, attachment.original_filename || attachment.filename);
    const checksum = fileChecksumFor(parsed, attachment.id);
    const blob = await getBackupFileBlob(parsed, attachment.id);
    const currentAttachment = currentById.get(attachment.id);

    if (!blob) {
      plans.set(attachment.id, { attachment, storagePath, blob, checksum, status: currentAttachment ? 'not-needed' : 'missing', error: 'El archivo físico no está incluido en el ZIP.' });
      continue;
    }

    if (checksum && (await sha256(blob)) !== checksum) {
      plans.set(attachment.id, { attachment, storagePath, blob, checksum, status: 'conflict', error: 'El checksum del archivo dentro del ZIP no coincide.' });
      continue;
    }

    const remoteState = await fileExistsWithChecksum(storagePath, checksum);
    if (remoteState === 'same') {
      plans.set(attachment.id, { attachment, storagePath, blob, checksum, status: 'existing' });
      continue;
    }
    if (remoteState === 'different') {
      plans.set(attachment.id, { attachment, storagePath, blob, checksum, status: 'conflict', error: 'Ya existe un archivo con la misma identidad pero distinto contenido.' });
      continue;
    }

    const { error } = await supabase.storage.from(bucketName).upload(storagePath, blob, {
      contentType: attachment.mime_type || 'application/octet-stream',
      upsert: false
    });
    plans.set(attachment.id, error ? { attachment, storagePath, blob, checksum, status: 'failed', error: error.message } : { attachment, storagePath, blob, checksum, status: 'uploaded' });
  }

  return plans;
}

async function restoreProfile(profile: BackupProfile | null, current: BackupProfile | null, summary: RestoreEntitySummary) {
  if (!profile) {
    summary.kept += 1;
    return;
  }
  if (!current) {
    summary.skipped += 1;
    summary.errors.push('No se encontró el perfil actual; se omitió display_name.');
    return;
  }
  if (profile.display_name === current.display_name) {
    summary.kept += 1;
    return;
  }
  if (!backupIsNewer(profile.updated_at, current.updated_at)) {
    summary.skipped += 1;
    return;
  }
  const { error } = await supabase.from('profiles').update({ display_name: profile.display_name, updated_at: profile.updated_at ?? nowIso() }).eq('user_id', current.user_id);
  if (error) {
    summary.errors.push(`profile: ${error.message}`);
    summary.skipped += 1;
    return;
  }
  summary.updated += 1;
}

async function restoreAttachments(parsed: ParsedBackup, current: CurrentData, userId: string, plans: Map<string, FilePlan>, summary: RestoreEntitySummary, files: RestoreFileSummary) {
  const currentById = new Map(current.attachments.map((item) => [item.id, item]));
  for (const attachment of parsed.data.attachments) {
    const plan = plans.get(attachment.id);
    const currentAttachment = currentById.get(attachment.id);
    if (!plan || plan.status === 'missing') {
      files.missingInZip += 1;
      if (!currentAttachment) {
        summary.skipped += 1;
        summary.errors.push(`attachment ${attachment.id}: falta archivo físico.`);
      }
      continue;
    }
    if (plan.status === 'conflict') {
      files.conflicts += 1;
      summary.conflicts += 1;
      summary.errors.push(`attachment ${attachment.id}: ${plan.error ?? 'conflicto de archivo.'}`);
      continue;
    }
    if (plan.status === 'failed') {
      files.failed += 1;
      files.errors.push(`attachment ${attachment.id}: ${plan.error ?? 'falló la subida.'}`);
      if (!currentAttachment) summary.skipped += 1;
      continue;
    }
    if (plan.status === 'uploaded') files.uploaded += 1;
    if (plan.status === 'existing') files.existing += 1;

    if (!shouldUpsert(attachment, currentAttachment, summary, comparableAttachment)) continue;

    const payload = attachmentForRestore(attachment, currentAttachment, userId, plan.storagePath);
    const { error } = await supabase.from('attachments').upsert(payload);
    if (error) {
      summary.errors.push(`attachment ${attachment.id}: ${error.message}`);
      if (plan.status === 'uploaded') await supabase.storage.from(bucketName).remove([plan.storagePath]).catch(() => undefined);
    }
  }
}

async function restoreRelations<T extends RelationRecord>(
  name: RestoreEntityName,
  table:
    | 'topic_relations'
    | 'topic_tags'
    | 'medication_tags'
    | 'procedure_tags'
    | 'attachment_links'
    | 'topic_attachments'
    | 'medication_attachments'
    | 'procedure_attachments',
  rows: T[],
  currentRows: T[],
  userId: string,
  summary: RestoreEntitySummary,
  keyFor: (row: T) => string,
  validReference: (row: T) => boolean,
  transform?: (row: T) => Record<string, unknown>
) {
  const currentKeys = new Set(currentRows.map(keyFor));
  for (const row of rows) {
    if (!validReference(row)) {
      summary.skipped += 1;
      summary.errors.push(`${name}: relación omitida por referencia faltante.`);
      continue;
    }
    if (currentKeys.has(keyFor(row))) {
      summary.kept += 1;
      continue;
    }
    const payload = transform ? transform(forcedUser(row, userId)) : forcedUser(row, userId);
    const { error } = await supabase.from(table).upsert(payload as never);
    if (error) {
      summary.errors.push(`${name}: ${error.message}`);
      summary.skipped += 1;
    } else {
      summary.created += 1;
    }
  }
}

async function refreshLocalData(userId: string, result: BackupMergeResult) {
  await Promise.all([
    loadTopicData(userId, true),
    loadMedicationData(userId, true),
    loadProcedureData(userId, true),
    syncAttachmentsFromSupabase(userId)
  ]);

  const db = await localDbPromise;
  await db.put('app_cache', {
    key: `backup:last-merge-restore:${userId}`,
    value: {
      completedAt: result.completedAt,
      finalStatus: result.finalStatus,
      entities: result.entities,
      files: result.files
    },
    updated_at: result.completedAt
  });
}

export async function restoreBackupMerge(
  file: File,
  userId: string,
  onProgress?: (progress: RestoreProgress) => void
): Promise<BackupMergeResult> {
  await ensureOnline();
  onProgress?.({ step: 'validating', message: 'Validando nuevamente el respaldo...' });
  const parsed = await parseValidatedBackupZip(file);
  await assertBackupOwner(parsed, userId);

  onProgress?.({ step: 'checking-current-data', message: 'Comparando con los datos actuales...' });
  const current = await fetchCurrentData(userId);
  const result = buildPreview(parsed, userId, current, emptyFileSummary()) as BackupMergeResult;
  result.files = emptyFileSummary();

  const filePlans = await prepareFiles(parsed, userId, current, onProgress);
  onProgress?.({ step: 'restoring-data', message: 'Restaurando entidades principales...' });

  await restoreProfile(parsed.data.profile, current.profile, result.entities.profile);
  await upsertTimestamped('folders', 'folders', parsed.data.folders, current.folders, userId, result.entities.folders);
  await upsertTimestamped('categories', 'categories', parsed.data.categories, current.categories, userId, result.entities.categories);
  await upsertTimestamped('tags', 'tags', parsed.data.tags, current.tags, userId, result.entities.tags);
  await upsertTimestamped('topics', 'topics', parsed.data.topics, current.topics, userId, result.entities.topics, comparableRecord, (topic) => ({
    ...topic,
    content_json: topic.content_json as Json
  }));
  await upsertTimestamped('medications', 'medications', parsed.data.medications, current.medications, userId, result.entities.medications, comparableRecord, (medication) => medication as unknown as Record<string, Json | string | boolean | null>);
  await upsertTimestamped('procedures', 'procedures', parsed.data.procedures, current.procedures, userId, result.entities.procedures, comparableRecord, (procedure) => procedureToSupabase(procedure));
  await restoreAttachments(parsed, current, userId, filePlans, result.entities.attachments, result.files);

  const refreshed = await fetchCurrentData(userId);
  const topicIds = new Set(refreshed.topics.map((item) => item.id));
  const medicationIds = new Set(refreshed.medications.map((item) => item.id));
  const procedureIds = new Set(refreshed.procedures.map((item) => item.id));
  const tagIds = new Set(refreshed.tags.map((item) => item.id));
  const attachmentIds = new Set(refreshed.attachments.map((item) => item.id));

  onProgress?.({ step: 'restoring-relations', message: 'Restaurando relaciones...' });
  await restoreRelations(
    'topic_relations',
    'topic_relations',
    parsed.data.topic_relations,
    refreshed.topic_relations,
    userId,
    result.entities.topic_relations,
    topicRelationKey,
    (row) => row.source_topic_id !== row.target_topic_id && topicIds.has(row.source_topic_id) && topicIds.has(row.target_topic_id),
    (row) => ({
      id: row.id,
      user_id: row.user_id,
      source_topic_id: row.source_topic_id,
      target_topic_id: row.target_topic_id,
      relation_type: row.relation_type,
      created_at: row.created_at
    })
  );
  await restoreRelations('topic_tags', 'topic_tags', parsed.data.topic_tags, refreshed.topic_tags, userId, result.entities.topic_tags, (row) => `${row.topic_id}:${row.tag_id}`, (row) => topicIds.has(row.topic_id) && tagIds.has(row.tag_id));
  await restoreRelations(
    'medication_tags',
    'medication_tags',
    parsed.data.medication_tags,
    refreshed.medication_tags,
    userId,
    result.entities.medication_tags,
    (row) => `${row.medication_id}:${row.tag_id}`,
    (row) => medicationIds.has(row.medication_id) && tagIds.has(row.tag_id)
  );
  await restoreRelations(
    'procedure_tags',
    'procedure_tags',
    parsed.data.procedure_tags,
    refreshed.procedure_tags,
    userId,
    result.entities.procedure_tags,
    (row) => `${row.procedure_id}:${row.tag_id}`,
    (row) => procedureIds.has(row.procedure_id) && tagIds.has(row.tag_id)
  );
  await restoreRelations(
    'attachment_links',
    'attachment_links',
    parsed.data.attachment_links,
    refreshed.attachment_links,
    userId,
    result.entities.attachment_links,
    (row) => `${row.attachment_id}:${row.owner_type}:${row.owner_id}`,
    (row) => attachmentIds.has(row.attachment_id)
  );
  await restoreRelations(
    'topic_attachments',
    'topic_attachments',
    parsed.data.topic_attachments,
    refreshed.topic_attachments,
    userId,
    result.entities.topic_attachments,
    (row) => `${row.topic_id}:${row.attachment_id}`,
    (row) => topicIds.has(row.topic_id) && attachmentIds.has(row.attachment_id)
  );
  await restoreRelations(
    'medication_attachments',
    'medication_attachments',
    parsed.data.medication_attachments,
    refreshed.medication_attachments,
    userId,
    result.entities.medication_attachments,
    (row) => `${row.medication_id}:${row.attachment_id}`,
    (row) => medicationIds.has(row.medication_id) && attachmentIds.has(row.attachment_id)
  );
  await restoreRelations(
    'procedure_attachments',
    'procedure_attachments',
    parsed.data.procedure_attachments,
    refreshed.procedure_attachments,
    userId,
    result.entities.procedure_attachments,
    (row) => `${row.procedure_id}:${row.attachment_id}`,
    (row) => procedureIds.has(row.procedure_id) && attachmentIds.has(row.attachment_id)
  );

  result.completedAt = nowIso();
  const hasErrors = Object.values(result.entities).some((summary) => summary.errors.length > 0 || summary.conflicts > 0) || result.files.errors.length > 0 || result.files.failed > 0 || result.files.conflicts > 0;
  const hasWarnings = hasErrors || result.warnings.length > 0 || result.files.missingInZip > 0;
  result.finalStatus = hasErrors ? 'incomplete' : hasWarnings ? 'completed-with-warnings' : 'completed';
  result.status = result.finalStatus === 'completed' ? 'ready' : 'ready-with-warnings';

  onProgress?.({ step: 'refreshing-local-data', message: 'Actualizando datos locales...' });
  await refreshLocalData(userId, result);
  onProgress?.({ step: 'done', message: 'Restauración combinada finalizada.' });

  return result;
}
