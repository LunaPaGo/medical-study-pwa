import JSZip from 'jszip';
import { checkSupabaseConnectivity } from '../../services/connectivity';
import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Attachment } from '../../types/attachment';
import type { Json } from '../../types/database';
import { runManualAttachmentSync } from '../attachments/attachmentRepository';
import { flushSyncQueue } from '../topics/topicRepository';
import { backupFormat, backupVersion, type BackupData, type BackupExportResult, type BackupManifest, type BackupProgress } from './backupTypes';

const bucketName = 'study-attachments';
const appVersion = '0.1.0';

type ExportOptions = {
  userId: string;
  onProgress?: (progress: BackupProgress) => void;
  onIncomplete?: (warnings: string[]) => Promise<boolean> | boolean;
};

function emitProgress(onProgress: ExportOptions['onProgress'], progress: BackupProgress) {
  onProgress?.(progress);
}

function jsonForZip(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function formatBackupFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
  return `medical-study-backup-${stamp}.zip`;
}

function sanitizeZipSegment(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^\.+/, '') || 'archivo';
}

async function sha256(blob: Blob | string) {
  const buffer = typeof blob === 'string' ? new TextEncoder().encode(blob) : await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getRows<T>(table: string, userId: string): Promise<T[]> {
  const { data, error } = await supabase.from(table as never).select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as T[];
}

async function collectBackupData(userId: string): Promise<BackupData> {
  const [profileResult, folders, categories, tags, topics, topicRelations, topicTags, medications, medicationTags, attachments, attachmentLinks, topicAttachments, medicationAttachments] =
    await Promise.all([
      supabase.from('profiles').select('user_id, display_name, created_at, updated_at').eq('user_id', userId).maybeSingle(),
      getRows<BackupData['folders'][number]>('folders', userId),
      getRows<BackupData['categories'][number]>('categories', userId),
      getRows<BackupData['tags'][number]>('tags', userId),
      getRows<BackupData['topics'][number]>('topics', userId),
      getRows<BackupData['topic_relations'][number]>('topic_relations', userId),
      getRows<BackupData['topic_tags'][number]>('topic_tags', userId),
      getRows<BackupData['medications'][number]>('medications', userId),
      getRows<BackupData['medication_tags'][number]>('medication_tags', userId),
      getRows<BackupData['attachments'][number]>('attachments', userId),
      getRows<BackupData['attachment_links'][number]>('attachment_links', userId),
      getRows<BackupData['topic_attachments'][number]>('topic_attachments', userId),
      getRows<BackupData['medication_attachments'][number]>('medication_attachments', userId)
    ]);

  if (profileResult.error) throw profileResult.error;

  return {
    profile: profileResult.data ?? null,
    folders,
    categories,
    tags,
    topics,
    topic_relations: topicRelations,
    topic_tags: topicTags,
    medications,
    medication_tags: medicationTags,
    attachments,
    attachment_links: attachmentLinks,
    topic_attachments: topicAttachments,
    medication_attachments: medicationAttachments
  };
}

function collectMedicalImageIds(document: unknown, ids = new Set<string>()) {
  if (!document || typeof document !== 'object') return ids;
  if (Array.isArray(document)) {
    document.forEach((item) => collectMedicalImageIds(item, ids));
    return ids;
  }

  const node = document as { type?: unknown; attrs?: { attachmentId?: unknown }; content?: unknown[] };
  if (node.type === 'medicalImage' && typeof node.attrs?.attachmentId === 'string') {
    ids.add(node.attrs.attachmentId);
  }
  if (Array.isArray(node.content)) {
    node.content.forEach((item) => collectMedicalImageIds(item, ids));
  }
  return ids;
}

function detectMedicalImageWarnings(data: BackupData) {
  const warnings: string[] = [];
  const attachmentIds = new Set(data.attachments.map((attachment) => attachment.id));
  const topicAttachmentIds = new Set(data.topic_attachments.map((link) => link.attachment_id));
  const medicationAttachmentIds = new Set(data.medication_attachments.map((link) => link.attachment_id));

  data.topics.forEach((topic) => {
    collectMedicalImageIds(topic.content_json).forEach((attachmentId) => {
      if (!attachmentIds.has(attachmentId)) warnings.push(`El tema "${topic.title}" referencia una imagen inexistente (${attachmentId}).`);
      if (!topicAttachmentIds.has(attachmentId)) warnings.push(`El tema "${topic.title}" tiene una imagen medicalImage sin relación topic_attachments (${attachmentId}).`);
    });
  });

  data.medications.forEach((medication) => {
    const name = medication.generic_name ?? 'Medicamento sin nombre';
    Object.values(medication).forEach((value) => {
      collectMedicalImageIds(value as Json).forEach((attachmentId) => {
        if (!attachmentIds.has(attachmentId)) warnings.push(`${name} referencia una imagen inexistente (${attachmentId}).`);
        if (!medicationAttachmentIds.has(attachmentId)) warnings.push(`${name} tiene una imagen medicalImage sin relación medication_attachments (${attachmentId}).`);
      });
    });
  });

  return warnings;
}

async function downloadAttachmentBlob(attachment: Attachment) {
  const { data, error } = await supabase.storage.from(bucketName).download(attachment.storage_path);
  if (!error && data) return { blob: data, source: 'supabase-storage' as const };

  const db = await localDbPromise;
  const pending = await db.get('pending_attachment_files', attachment.id);
  if (pending?.file) return { blob: pending.file, source: 'indexeddb-local-blob' as const };

  throw new Error(error?.message ?? 'Archivo físico no disponible.');
}

async function addDataFile(zip: JSZip, path: string, value: unknown, checksums: Record<string, string>) {
  const content = jsonForZip(value);
  zip.file(path, content);
  checksums[path] = await sha256(content);
  return new Blob([content]).size;
}

export async function createCompleteBackup(options: ExportOptions): Promise<BackupExportResult> {
  const { userId, onProgress, onIncomplete } = options;
  const warnings: string[] = [];
  let approximateTotalSize = 0;

  emitProgress(onProgress, { step: 'checking', message: 'Verificando conexión con Supabase...' });
  const connection = await checkSupabaseConnectivity(3000);
  if (connection !== 'online') {
    throw new Error('Una copia completa requiere conexión a Internet.');
  }

  emitProgress(onProgress, { step: 'syncing', message: 'Sincronizando cambios pendientes...' });
  await flushSyncQueue(userId);
  const attachmentSync = await runManualAttachmentSync(userId);
  warnings.push(...attachmentSync.errors.map((error) => `Sincronización de archivos: ${error}`));

  emitProgress(onProgress, { step: 'collecting', message: 'Preparando datos...' });
  const data = await collectBackupData(userId);
  warnings.push(...detectMedicalImageWarnings(data));

  const zip = new JSZip();
  const dataChecksums: Record<string, string> = {};
  const fileChecksums: Record<string, string> = {};
  const fileEntries: BackupManifest['files'] = [];

  approximateTotalSize += await addDataFile(zip, 'data/profile.json', data.profile, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/organization.json', { folders: data.folders, categories: data.categories, tags: data.tags, topic_tags: data.topic_tags, medication_tags: data.medication_tags }, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/topics.json', data.topics, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/topic_relations.json', data.topic_relations, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/medications.json', data.medications, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/attachments.json', data.attachments, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/attachment_links.json', data.attachment_links, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/topic_attachments.json', data.topic_attachments, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/medication_attachments.json', data.medication_attachments, dataChecksums);
  approximateTotalSize += await addDataFile(zip, 'data/user_settings.json', { exported_display_name: data.profile?.display_name ?? null }, dataChecksums);

  emitProgress(onProgress, { step: 'downloading-files', message: 'Descargando archivos...', current: 0, total: data.attachments.length });
  for (const [index, attachment] of data.attachments.entries()) {
    try {
      const { blob, source } = await downloadAttachmentBlob(attachment);
      const filename = sanitizeZipSegment(attachment.original_filename || attachment.filename);
      const path = `files/${attachment.id}/${filename}`;
      const checksum = await sha256(blob);
      zip.file(path, blob);
      approximateTotalSize += blob.size;
      fileChecksums[path] = checksum;
      fileEntries.push({
        attachment_id: attachment.id,
        path,
        original_filename: attachment.original_filename,
        mime_type: attachment.mime_type,
        size: blob.size,
        source,
        checksum
      });
    } catch (error) {
      warnings.push(`No se pudo incluir el archivo "${attachment.original_filename}": ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
    emitProgress(onProgress, {
      step: 'downloading-files',
      message: `Descargando archivos ${index + 1} de ${data.attachments.length}...`,
      current: index + 1,
      total: data.attachments.length
    });
  }

  const missingFiles = data.attachments.length - fileEntries.length;
  if (missingFiles > 0) {
    warnings.push(`El respaldo quedó incompleto: faltan ${missingFiles} archivo(s) físico(s).`);
  }

  const complete = missingFiles === 0 && warnings.length === 0;
  if (!complete && onIncomplete) {
    const shouldContinue = await onIncomplete(warnings);
    if (!shouldContinue) {
      throw new Error('Exportación cancelada por respaldo incompleto.');
    }
  }

  emitProgress(onProgress, { step: 'verifying', message: 'Verificando respaldo...' });
  const manifest: BackupManifest = {
    backup_format: backupFormat,
    backup_version: backupVersion,
    app_version: appVersion,
    created_at: new Date().toISOString(),
    exported_by_user_id: userId,
    complete,
    counts: {
      profile: data.profile ? 1 : 0,
      folders: data.folders.length,
      categories: data.categories.length,
      tags: data.tags.length,
      topics: data.topics.length,
      topic_relations: data.topic_relations.length,
      topic_tags: data.topic_tags.length,
      medications: data.medications.length,
      medication_tags: data.medication_tags.length,
      attachments: data.attachments.length,
      attachment_links: data.attachment_links.length,
      topic_attachments: data.topic_attachments.length,
      medication_attachments: data.medication_attachments.length,
      files: fileEntries.length
    },
    approximate_total_size: approximateTotalSize,
    checksum_algorithm: 'SHA-256',
    checksums: {
      data: dataChecksums,
      files: fileChecksums
    },
    files: fileEntries,
    warnings
  };

  const manifestContent = jsonForZip(manifest);
  zip.file('manifest.json', manifestContent);

  emitProgress(onProgress, { step: 'zipping', message: 'Generando ZIP...' });
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const filename = formatBackupFilename();

  const db = await localDbPromise;
  await db.put('app_cache', {
    key: `backup:last-export:${userId}`,
    value: {
      filename,
      size: blob.size,
      created_at: manifest.created_at,
      complete,
      warnings: warnings.length
    },
    updated_at: manifest.created_at
  });

  emitProgress(onProgress, { step: 'done', message: 'Copia creada correctamente.' });
  return { blob, filename, manifest };
}

export async function getLastBackupExport(userId: string) {
  const db = await localDbPromise;
  const record = await db.get('app_cache', `backup:last-export:${userId}`);
  return record?.value as { filename: string; size: number; created_at: string; complete: boolean; warnings: number } | undefined;
}
