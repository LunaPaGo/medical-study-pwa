import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Attachment, ProcedureAttachment } from '../../types/attachment';
import type { Json } from '../../types/database';
import type { Procedure, ProcedureFilterOptions, ProcedureFormValues, ProcedureTag, ProcedureWithRelations } from '../../types/procedure';
import type { SyncAction, Tag, TipTapDocument } from '../../types/topic';
import { emptyTipTapDocument, getTopicDocument } from '../topics/tiptapDocument';
import { procedureStudySections } from './procedureSectionCatalog';

type ProcedurePayload = { procedure: Procedure; tagIds: string[] };
type QueuedProcedurePayload = ProcedurePayload | { id: string; user_id: string };
type ProcedureStudyJsonField = (typeof procedureStudySections)[number]['jsonField'];
type ProcedureStudyHtmlField = (typeof procedureStudySections)[number]['htmlField'];
type SupabaseProcedurePayload = Omit<Procedure, ProcedureStudyJsonField> & Record<ProcedureStudyJsonField, Json>;

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return crypto.randomUUID();
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : null;
}

function emitSyncQueueChanged() {
  window.dispatchEvent(new Event('sync-queue-changed'));
}

function logProcedureSyncStep(message: string, details?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[procedure_sync] ${message}`, details ?? {});
  }
}

function logProcedureSyncError(message: string, error: unknown, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  const supabaseError = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown; status?: unknown };
  console.warn(`[procedure_sync] ${message}`, {
    ...details,
    code: typeof supabaseError?.code === 'string' ? supabaseError.code : undefined,
    message: typeof supabaseError?.message === 'string' ? supabaseError.message : undefined,
    details: typeof supabaseError?.details === 'string' ? supabaseError.details : undefined,
    hint: typeof supabaseError?.hint === 'string' ? supabaseError.hint : undefined,
    status:
      typeof supabaseError?.status === 'number' || typeof supabaseError?.status === 'string'
        ? supabaseError.status
        : undefined
  });
}

function tiptapToText(document: TipTapDocument): string {
  const parts: string[] = [];
  const visit = (node?: TipTapDocument) => {
    if (!node) return;
    if (node.text) parts.push(node.text);
    node.content?.forEach(visit);
  };
  visit(document);
  return parts.join(' ');
}

function procedureStudyValues(source: Pick<Procedure, ProcedureStudyJsonField | ProcedureStudyHtmlField>) {
  return procedureStudySections.reduce(
    (fields, section) => ({
      ...fields,
      [section.jsonField]: getTopicDocument(source[section.jsonField]),
      [section.htmlField]: source[section.htmlField] || '<p></p>'
    }),
    {} as Pick<Procedure, ProcedureStudyJsonField | ProcedureStudyHtmlField>
  );
}

function procedureForSupabase(procedure: Procedure): SupabaseProcedurePayload {
  return {
    id: procedure.id,
    user_id: procedure.user_id,
    name: procedure.name,
    summary: procedure.summary,
    category: procedure.category,
    status: procedure.status,
    is_favorite: procedure.is_favorite,
    technique_json: getTopicDocument(procedure.technique_json) as Json,
    technique_html: procedure.technique_html || '<p></p>',
    considerations_json: getTopicDocument(procedure.considerations_json) as Json,
    considerations_html: procedure.considerations_html || '<p></p>',
    search_text: procedure.search_text ?? '',
    created_at: procedure.created_at,
    updated_at: procedure.updated_at
  };
}

function normalizeProcedure(item: Procedure): Procedure {
  return {
    ...item,
    name: item.name ?? '',
    search_text: item.search_text ?? '',
    ...procedureStudyValues(item)
  };
}

async function getByUser<T extends { user_id: string }>(
  storeName: 'procedures' | 'procedure_tags' | 'procedure_attachments' | 'tags' | 'attachments',
  userId: string
): Promise<T[]> {
  const db = await localDbPromise;
  return (await db.getAllFromIndex(storeName, 'user_id', userId)) as unknown as T[];
}

async function enqueueProcedure(userId: string, action: SyncAction, payload: QueuedProcedurePayload) {
  const db = await localDbPromise;
  const procedureId = 'procedure' in payload ? payload.procedure.id : payload.id;
  logProcedureSyncStep('enqueue', { action, procedureId, userId });
  await db.put('sync_queue', {
    id: generateId(),
    user_id: userId,
    entity: 'procedure',
    action,
    payload,
    created_at: nowIso()
  });
  emitSyncQueueChanged();
}

async function replaceProcedureTags(procedureId: string, userId: string, tagIds: string[]) {
  const db = await localDbPromise;
  const existing = await db.getAllFromIndex('procedure_tags', 'procedure_id', procedureId);
  const tx = db.transaction('procedure_tags', 'readwrite');
  await Promise.all(existing.map((item) => tx.store.delete([item.procedure_id, item.tag_id] as [string, string])));
  await Promise.all(
    tagIds.map((tagId) =>
      tx.store.put({
        procedure_id: procedureId,
        tag_id: tagId,
        user_id: userId,
        created_at: nowIso()
      })
    )
  );
  await tx.done;
}

function buildSearchText(values: { procedure: Procedure; tags: Tag[] }) {
  const { procedure, tags } = values;
  return [
    procedure.name,
    procedure.summary,
    procedure.category,
    ...tags.map((tag) => tag.name),
    ...procedureStudySections.map((section) => tiptapToText(procedure[section.jsonField]))
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function cacheRemoteProcedureData(userId: string) {
  const [proceduresResult, procedureTagsResult, tagsResult, procedureAttachmentsResult, attachmentsResult] = await Promise.all([
    supabase.from('procedures').select('*').eq('user_id', userId),
    supabase.from('procedure_tags').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('procedure_attachments').select('*').eq('user_id', userId),
    supabase.from('attachments').select('*').eq('user_id', userId)
  ]);

  const firstError = proceduresResult.error ?? procedureTagsResult.error ?? tagsResult.error ?? procedureAttachmentsResult.error ?? attachmentsResult.error;
  if (firstError) throw firstError;

  const db = await localDbPromise;
  const tx = db.transaction(['procedures', 'procedure_tags', 'tags', 'procedure_attachments', 'attachments'], 'readwrite');
  await Promise.all((proceduresResult.data ?? []).map((item) => tx.objectStore('procedures').put(normalizeProcedure(item as Procedure))));
  await Promise.all((procedureTagsResult.data ?? []).map((item) => tx.objectStore('procedure_tags').put(item as ProcedureTag)));
  await Promise.all((tagsResult.data ?? []).map((item) => tx.objectStore('tags').put(item as Tag)));
  await Promise.all((procedureAttachmentsResult.data ?? []).map((item) => tx.objectStore('procedure_attachments').put(item as ProcedureAttachment)));
  await Promise.all((attachmentsResult.data ?? []).map((item) => tx.objectStore('attachments').put({ ...item, sync_status: 'synced' })));
  await tx.done;
}

export async function loadProcedureData(userId: string, shouldSyncRemote = navigator.onLine) {
  if (shouldSyncRemote) {
    try {
      await cacheRemoteProcedureData(userId);
    } catch {
      // La copia local queda disponible para lectura sin conexión.
    }
  }

  const [procedures, procedureTags, tags, procedureAttachments, attachments] = await Promise.all([
    getByUser<Procedure>('procedures', userId),
    getByUser<ProcedureTag>('procedure_tags', userId),
    getByUser<Tag>('tags', userId),
    getByUser<ProcedureAttachment>('procedure_attachments', userId),
    getByUser<Attachment>('attachments', userId)
  ]);

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const attachmentsById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  const tagsByProcedure = procedureTags.reduce<Map<string, Tag[]>>((map, item) => {
    const tag = tagsById.get(item.tag_id);
    if (tag) map.set(item.procedure_id, [...(map.get(item.procedure_id) ?? []), tag]);
    return map;
  }, new Map());
  const attachmentsByProcedure = procedureAttachments.reduce<Map<string, Attachment[]>>((map, item) => {
    const attachment = attachmentsById.get(item.attachment_id);
    if (attachment) map.set(item.procedure_id, [...(map.get(item.procedure_id) ?? []), attachment]);
    return map;
  }, new Map());

  return {
    procedures: procedures.map((procedure) => ({
      ...normalizeProcedure(procedure),
      tags: tagsByProcedure.get(procedure.id) ?? [],
      attachments: attachmentsByProcedure.get(procedure.id) ?? []
    })) as ProcedureWithRelations[],
    tags
  };
}

export async function getProcedureById(userId: string, procedureId: string) {
  const data = await loadProcedureData(userId, navigator.onLine);
  return data.procedures.find((procedure) => procedure.id === procedureId) ?? null;
}

async function pushProcedureToSupabase(payload: ProcedurePayload) {
  const { procedure, tagIds } = payload;
  const remotePayload = procedureForSupabase(procedure);
  logProcedureSyncStep('upsert_start', {
    procedureId: procedure.id,
    userId: procedure.user_id,
    fields: Object.keys(remotePayload),
    tagCount: tagIds.length
  });
  const { error: procedureError } = await supabase.from('procedures').upsert(remotePayload);
  if (procedureError) {
    logProcedureSyncError('upsert_error', procedureError, { procedureId: procedure.id, userId: procedure.user_id });
    throw procedureError;
  }

  const { error: deleteError } = await supabase.from('procedure_tags').delete().eq('procedure_id', procedure.id).eq('user_id', procedure.user_id);
  if (deleteError) {
    logProcedureSyncError('delete_tags_error', deleteError, { procedureId: procedure.id, userId: procedure.user_id });
    throw deleteError;
  }

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ procedure_id: procedure.id, tag_id: tagId, user_id: procedure.user_id }));
    const { error: tagError } = await supabase.from('procedure_tags').insert(rows);
    if (tagError) {
      logProcedureSyncError('insert_tags_error', tagError, { procedureId: procedure.id, userId: procedure.user_id, tagCount: rows.length });
      throw tagError;
    }
  }
  logProcedureSyncStep('upsert_success', { procedureId: procedure.id, userId: procedure.user_id, tagCount: tagIds.length });
}

export async function saveProcedure(userId: string, values: ProcedureFormValues, existing?: ProcedureWithRelations) {
  const timestamp = nowIso();
  const procedure: Procedure = {
    id: existing?.id ?? values.id ?? generateId(),
    user_id: userId,
    name: values.name.trim(),
    summary: normalizeOptional(values.summary),
    category: normalizeOptional(values.category),
    status: values.status,
    is_favorite: values.is_favorite,
    search_text: '',
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
    ...procedureStudyValues(values)
  };

  const db = await localDbPromise;
  const tags = await getByUser<Tag>('tags', userId);
  const selectedTags = tags.filter((tag) => values.tag_ids.includes(tag.id));
  procedure.search_text = buildSearchText({ procedure, tags: selectedTags });

  await db.put('procedures', procedure);
  await replaceProcedureTags(procedure.id, userId, values.tag_ids);

  const payload = { procedure, tagIds: values.tag_ids };
  if (navigator.onLine) {
    try {
      await pushProcedureToSupabase(payload);
    } catch {
      await enqueueProcedure(userId, 'upsert', payload);
    }
  } else {
    await enqueueProcedure(userId, 'upsert', payload);
  }

  return procedure;
}

export async function deleteProcedure(userId: string, procedureId: string) {
  const db = await localDbPromise;
  const procedureTags = await db.getAllFromIndex('procedure_tags', 'procedure_id', procedureId);
  const procedureAttachments = await db.getAllFromIndex('procedure_attachments', 'procedure_id', procedureId);
  const tx = db.transaction(['procedures', 'procedure_tags', 'procedure_attachments'], 'readwrite');
  await tx.objectStore('procedures').delete(procedureId);
  await Promise.all(procedureTags.map((item) => tx.objectStore('procedure_tags').delete([item.procedure_id, item.tag_id] as [string, string])));
  await Promise.all(procedureAttachments.map((item) => tx.objectStore('procedure_attachments').delete(item.id)));
  await tx.done;

  const payload = { id: procedureId, user_id: userId };
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from('procedures').delete().eq('id', procedureId).eq('user_id', userId);
      if (error) throw error;
    } catch {
      await enqueueProcedure(userId, 'delete', payload);
    }
  } else {
    await enqueueProcedure(userId, 'delete', payload);
  }
}

export async function toggleProcedureFavorite(userId: string, procedure: ProcedureWithRelations) {
  return saveProcedure(
    userId,
    {
      name: procedure.name,
      summary: procedure.summary ?? '',
      category: procedure.category ?? '',
      status: procedure.status,
      is_favorite: !procedure.is_favorite,
      tag_ids: procedure.tags.map((tag) => tag.id),
      ...procedureStudyValues(procedure)
    },
    procedure
  );
}

export function filterProcedures(procedures: ProcedureWithRelations[], options: ProcedureFilterOptions) {
  const needle = options.search.trim().toLowerCase();
  const filtered = procedures.filter((procedure) => {
    const matchesSearch = !needle || procedure.search_text.includes(needle);
    const matchesCategory = !options.category || procedure.category === options.category;
    const matchesTag = !options.tagId || procedure.tags.some((tag) => tag.id === options.tagId);
    const matchesFavorite = !options.favoriteOnly || procedure.is_favorite;
    const matchesStatus = !options.status || procedure.status === options.status;
    return matchesSearch && matchesCategory && matchesTag && matchesFavorite && matchesStatus;
  });

  return filtered.sort((a, b) => {
    if (options.sort === 'name_asc') return a.name.localeCompare(b.name, 'es');
    if (options.sort === 'created_desc') return b.created_at.localeCompare(a.created_at);
    if (options.sort === 'favorite_desc') return Number(b.is_favorite) - Number(a.is_favorite) || b.updated_at.localeCompare(a.updated_at);
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export async function flushProcedureQueueItem(item: { action: SyncAction; payload: unknown; user_id: string }) {
  if (item.action === 'delete') {
    const payload = item.payload as { id: string; user_id: string };
    const { error } = await supabase.from('procedures').delete().eq('id', payload.id).eq('user_id', item.user_id);
    if (error) throw error;
    return;
  }

  await pushProcedureToSupabase(item.payload as ProcedurePayload);
}

export function createEmptyProcedureValues(id = generateId()): ProcedureFormValues {
  return {
    id,
    name: '',
    summary: '',
    category: '',
    status: 'draft',
    is_favorite: false,
    tag_ids: [],
    ...procedureStudySections.reduce(
      (fields, section) => ({ ...fields, [section.jsonField]: emptyTipTapDocument, [section.htmlField]: '<p></p>' }),
      {} as Pick<ProcedureFormValues, ProcedureStudyJsonField | ProcedureStudyHtmlField>
    )
  };
}
