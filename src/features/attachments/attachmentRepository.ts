import { supabase } from '../../services/supabase';
import { checkSupabaseConnectivity } from '../../services/connectivity';
import { localDbPromise } from '../../storage/localDb';
import type { Json } from '../../types/database';
import type {
  Attachment,
  AttachmentLink,
  AttachmentOwnerType,
  MedicationAttachment,
  PendingAttachmentFile,
  TopicAttachment
} from '../../types/attachment';
import type { Medication, MedicationRichField } from '../../types/medication';
import type { SyncAction, Topic } from '../../types/topic';
import { processImage } from './imageProcessing';

const bucketName = 'study-attachments';
const medicationAttachmentFields: MedicationRichField[] = [
  'mechanism_of_action',
  'therapeutic_targets',
  'pharmacologic_effects',
  'indications',
  'clinical_application',
  'adult_dose',
  'pediatric_dose',
  'dose_and_dilution',
  'administration',
  'onset_time',
  'transport',
  'metabolism',
  'elimination',
  'adverse_effects',
  'contraindications',
  'antidote',
  'personal_notes',
  'bibliography'
];

type AttachmentPayload = {
  attachment: Attachment;
  link?: Omit<AttachmentLink, 'id' | 'created_at'>;
  topicAttachment?: TopicAttachment;
  medicationAttachment?: MedicationAttachment;
};

export type AttachmentUsageSummary = {
  topics: number;
  medications: number;
  total: number;
};

export type AttachmentReconciliationReport = {
  localOnly: number;
  remoteOnly: number;
  invalidStoragePath: number;
  remoteLinksMissingLocally: number;
  storageObjectsWithoutRecord: number;
};

export type AttachmentSyncSummary = {
  uploaded: number;
  downloaded: number;
  associationsUpdated: number;
  deletedLocal: number;
  cleanedOrphans: number;
  conflicts: number;
  errors: string[];
  completedAt: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return crypto.randomUUID();
}

function safeFileName(name: string) {
  const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
  return clean || 'archivo';
}

function extensionFromName(name: string) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index) : '';
}

function pathsFor(userId: string, attachmentId: string, originalName: string) {
  const ext = extensionFromName(originalName);
  const filename = `${safeFileName(originalName.replace(/\.[^/.]+$/, '')) || 'archivo'}${ext}`;
  return {
    storagePath: `${userId}/${attachmentId}/${filename}`,
    thumbnailPath: `${userId}/thumbnails/${attachmentId}.jpg`
  };
}

function emitSyncQueueChanged() {
  window.dispatchEvent(new Event('sync-queue-changed'));
}

async function enqueueAttachment(userId: string, action: SyncAction, payload: AttachmentPayload | { id: string; user_id: string }) {
  const db = await localDbPromise;
  await db.put('sync_queue', {
    id: generateId(),
    user_id: userId,
    entity: 'attachment',
    action,
    payload,
    created_at: nowIso()
  });
  emitSyncQueueChanged();
}

function createTopicAttachment(userId: string, topicId: string, attachmentId: string): TopicAttachment {
  return {
    id: generateId(),
    user_id: userId,
    topic_id: topicId,
    attachment_id: attachmentId,
    created_at: nowIso()
  };
}

function createMedicationAttachment(userId: string, medicationId: string, attachmentId: string): MedicationAttachment {
  return {
    id: generateId(),
    user_id: userId,
    medication_id: medicationId,
    attachment_id: attachmentId,
    created_at: nowIso()
  };
}

export async function getAttachments(userId: string) {
  const db = await localDbPromise;

  if (navigator.onLine) {
    try {
      await syncAttachmentsFromSupabase(userId);
    } catch (error) {
      console.warn('ATTACHMENTS_SYNC_FAILED', error);
      // Offline cache remains available.
    }
  }

  return (await db.getAllFromIndex('attachments', 'user_id', userId)).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function syncAttachmentsFromSupabase(
  userId: string
): Promise<Omit<AttachmentSyncSummary, 'uploaded' | 'errors' | 'completedAt' | 'cleanedOrphans'>> {
  const [attachmentsResult, topicAttachmentsResult, medicationAttachmentsResult, linksResult] = await Promise.all([
    supabase.from('attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('topic_attachments').select('*').eq('user_id', userId),
    supabase.from('medication_attachments').select('*').eq('user_id', userId),
    supabase.from('attachment_links').select('*').eq('user_id', userId)
  ]);

  const firstError = attachmentsResult.error ?? topicAttachmentsResult.error ?? medicationAttachmentsResult.error ?? linksResult.error;
  if (firstError) throw firstError;

  const db = await localDbPromise;
  const remoteAttachments = (attachmentsResult.data ?? []) as Attachment[];
  const remoteTopicLinks = (topicAttachmentsResult.data ?? []) as TopicAttachment[];
  const remoteMedicationLinks = (medicationAttachmentsResult.data ?? []) as MedicationAttachment[];
  const remoteGenericLinks = (linksResult.data ?? []) as AttachmentLink[];
  const remoteAttachmentIds = new Set(remoteAttachments.map((attachment) => attachment.id));
  const remoteTopicLinkIds = new Set(remoteTopicLinks.map((link) => link.id));
  const remoteMedicationLinkIds = new Set(remoteMedicationLinks.map((link) => link.id));
  const remoteGenericLinkIds = new Set(remoteGenericLinks.map((link) => link.id));
  const localBefore = await db.getAllFromIndex('attachments', 'user_id', userId);
  const localBeforeById = new Map(localBefore.map((attachment) => [attachment.id, attachment]));
  let downloaded = 0;
  let conflicts = 0;
  let associationsUpdated = 0;
  let deletedLocal = 0;

  const writeTx = db.transaction(['attachments', 'topic_attachments', 'medication_attachments', 'attachment_links'], 'readwrite');
  await Promise.all(
    remoteAttachments.map((item) => {
      const local = localBeforeById.get(item.id);
      if (!local) {
        downloaded += 1;
      } else if (local.updated_at > item.updated_at && local.sync_status !== 'synced') {
        conflicts += 1;
        return Promise.resolve();
      }
      return writeTx.objectStore('attachments').put({ ...item, sync_status: 'synced', error_message: null });
    })
  );
  await Promise.all(
    remoteTopicLinks.map((item) => {
      associationsUpdated += 1;
      return writeTx.objectStore('topic_attachments').put(item);
    })
  );
  await Promise.all(
    remoteMedicationLinks.map((item) => {
      associationsUpdated += 1;
      return writeTx.objectStore('medication_attachments').put(item);
    })
  );
  await Promise.all(
    remoteGenericLinks.map((item) => {
      associationsUpdated += 1;
      return writeTx.objectStore('attachment_links').put(item);
    })
  );
  await writeTx.done;

  const [localAttachments, localTopicLinks, localMedicationLinks, localGenericLinks] = await Promise.all([
    db.getAllFromIndex('attachments', 'user_id', userId),
    db.getAllFromIndex('topic_attachments', 'user_id', userId),
    db.getAllFromIndex('medication_attachments', 'user_id', userId),
    db.getAllFromIndex('attachment_links', 'user_id', userId)
  ]);

  const deleteTx = db.transaction(['attachments', 'topic_attachments', 'medication_attachments', 'attachment_links'], 'readwrite');
  await Promise.all(
    localAttachments
      .filter((item) => item.sync_status === 'synced' && !remoteAttachmentIds.has(item.id))
      .map((item) => {
        deletedLocal += 1;
        return deleteTx.objectStore('attachments').delete(item.id);
      })
  );
  await Promise.all(
    localTopicLinks.filter((item) => !remoteTopicLinkIds.has(item.id)).map((item) => deleteTx.objectStore('topic_attachments').delete(item.id))
  );
  await Promise.all(
    localMedicationLinks.filter((item) => !remoteMedicationLinkIds.has(item.id)).map((item) => deleteTx.objectStore('medication_attachments').delete(item.id))
  );
  await Promise.all(
    localGenericLinks.filter((item) => !remoteGenericLinkIds.has(item.id)).map((item) => deleteTx.objectStore('attachment_links').delete(item.id))
  );
  await deleteTx.done;

  return { downloaded, associationsUpdated, deletedLocal, conflicts };
}

export async function getAttachmentFile(attachmentId: string) {
  const db = await localDbPromise;
  return db.get('pending_attachment_files', attachmentId);
}

export async function getAttachmentById(attachmentId: string) {
  const db = await localDbPromise;
  const local = await db.get('attachments', attachmentId);
  if (local || !navigator.onLine) return local;

  const { data, error } = await supabase.from('attachments').select('*').eq('id', attachmentId).single();
  if (error || !data) return undefined;
  const attachment = { ...(data as Attachment), sync_status: 'synced' as const };
  await db.put('attachments', attachment);
  return attachment;
}

async function uploadAttachmentFiles(attachment: Attachment, pending: PendingAttachmentFile) {
  const { error: uploadError } = await supabase.storage.from(bucketName).upload(attachment.storage_path, pending.file, {
    contentType: attachment.mime_type,
    upsert: true
  });
  if (uploadError) throw uploadError;

  if (pending.thumbnail && attachment.thumbnail_path) {
    const { error: thumbnailError } = await supabase.storage.from(bucketName).upload(attachment.thumbnail_path, pending.thumbnail, {
      contentType: 'image/jpeg',
      upsert: true
    });
    if (thumbnailError) throw thumbnailError;
  }
}

async function pushAttachmentToSupabase(payload: AttachmentPayload) {
  const db = await localDbPromise;
  const pending = await db.get('pending_attachment_files', payload.attachment.id);
  const uploadedPaths: string[] = [];
  if (pending) {
    await uploadAttachmentFiles(payload.attachment, pending);
    uploadedPaths.push(payload.attachment.storage_path);
    if (payload.attachment.thumbnail_path) uploadedPaths.push(payload.attachment.thumbnail_path);
  }

  const record = {
    id: payload.attachment.id,
    user_id: payload.attachment.user_id,
    filename: payload.attachment.filename,
    original_filename: payload.attachment.original_filename,
    mime_type: payload.attachment.mime_type,
    size: payload.attachment.size,
    width: payload.attachment.width,
    height: payload.attachment.height,
    storage_path: payload.attachment.storage_path,
    thumbnail_path: payload.attachment.thumbnail_path,
    created_at: payload.attachment.created_at,
    updated_at: payload.attachment.updated_at
  };

  const { error } = await supabase.from('attachments').upsert(record);
  if (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(bucketName).remove(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }

  if (payload.link) {
    const { error: linkError } = await supabase.from('attachment_links').upsert(payload.link);
    if (linkError) throw linkError;
  }

  if (payload.topicAttachment) {
    const { error: topicLinkError } = await supabase.from('topic_attachments').upsert(payload.topicAttachment);
    if (topicLinkError) throw topicLinkError;
    await db.put('topic_attachments', payload.topicAttachment);
  }

  if (payload.medicationAttachment) {
    const { error: medicationLinkError } = await supabase.from('medication_attachments').upsert(payload.medicationAttachment);
    if (medicationLinkError) throw medicationLinkError;
    await db.put('medication_attachments', payload.medicationAttachment);
  }

  await db.put('attachments', { ...payload.attachment, sync_status: 'synced', error_message: null });
  await db.delete('pending_attachment_files', payload.attachment.id);
}

async function buildAttachmentPayloadFromLocal(userId: string, attachment: Attachment): Promise<AttachmentPayload> {
  const db = await localDbPromise;
  const [topicLinks, medicationLinks, genericLinks] = await Promise.all([
    db.getAllFromIndex('topic_attachments', 'attachment_id', attachment.id),
    db.getAllFromIndex('medication_attachments', 'attachment_id', attachment.id),
    db.getAllFromIndex('attachment_links', 'attachment_id', attachment.id)
  ]);
  const topicAttachment = topicLinks.find((item) => item.user_id === userId);
  const medicationAttachment = medicationLinks.find((item) => item.user_id === userId);
  const link = genericLinks.find((item) => item.user_id === userId);

  return {
    attachment,
    topicAttachment,
    medicationAttachment,
    link: link
      ? {
          user_id: link.user_id,
          attachment_id: link.attachment_id,
          owner_type: link.owner_type,
          owner_id: link.owner_id
        }
      : undefined
  };
}

async function uploadPendingLocalAttachments(userId: string) {
  const db = await localDbPromise;
  const errors: string[] = [];
  let uploaded = 0;
  const cleanedOrphans = await cleanupOrphanedAttachmentSyncItems(userId);
  const queueItems = (await db.getAllFromIndex('sync_queue', 'user_id', userId)).filter((item) => item.entity === 'attachment');

  for (const item of queueItems) {
    try {
      await flushAttachmentQueueItem(item);
      await db.delete('sync_queue', item.id);
      uploaded += item.action === 'upsert' ? 1 : 0;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Error al sincronizar un archivo pendiente.');
    }
  }

  const localAttachments = await db.getAllFromIndex('attachments', 'user_id', userId);
  const pendingAttachments = localAttachments.filter((attachment) => attachment.sync_status && attachment.sync_status !== 'synced');
  for (const attachment of pendingAttachments) {
    try {
      await pushAttachmentToSupabase(await buildAttachmentPayloadFromLocal(userId, attachment));
      uploaded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir un archivo local.';
      await db.put('attachments', { ...attachment, sync_status: 'error', error_message: message });
      errors.push(message);
    }
  }

  return { uploaded, cleanedOrphans, errors };
}

export async function runManualAttachmentSync(userId: string): Promise<AttachmentSyncSummary> {
  const connection = await checkSupabaseConnectivity(2500);
  if (connection !== 'online') {
    return {
      uploaded: 0,
      downloaded: 0,
      associationsUpdated: 0,
      deletedLocal: 0,
      cleanedOrphans: 0,
      conflicts: 0,
      errors: ['Sin conexión. No se pudo sincronizar.'],
      completedAt: null
    };
  }

  const uploadResult = await uploadPendingLocalAttachments(userId);
  let remoteResult: Omit<AttachmentSyncSummary, 'uploaded' | 'errors' | 'completedAt' | 'cleanedOrphans'> = {
    downloaded: 0,
    associationsUpdated: 0,
    deletedLocal: 0,
    conflicts: 0
  };
  const errors = [...uploadResult.errors];

  try {
    remoteResult = await syncAttachmentsFromSupabase(userId);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Error al descargar archivos remotos.');
  }

  const completedAt = errors.length === 0 ? nowIso() : null;
  if (completedAt) {
    const db = await localDbPromise;
    await db.put('app_cache', { key: `attachments:last-sync:${userId}`, value: completedAt, updated_at: completedAt });
  }

  return {
    uploaded: uploadResult.uploaded,
    downloaded: remoteResult.downloaded,
    associationsUpdated: remoteResult.associationsUpdated,
    deletedLocal: remoteResult.deletedLocal,
    cleanedOrphans: uploadResult.cleanedOrphans,
    conflicts: remoteResult.conflicts,
    errors,
    completedAt
  };
}

function attachmentIdFromQueuePayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as { id?: unknown; attachment?: { id?: unknown } };
  if (typeof value.id === 'string') return value.id;
  if (typeof value.attachment?.id === 'string') return value.attachment.id;
  return null;
}

export async function cleanupOrphanedAttachmentSyncItems(userId: string) {
  const db = await localDbPromise;
  const attachmentQueueItems = (await db.getAllFromIndex('sync_queue', 'user_id', userId)).filter((item) => item.entity === 'attachment');
  let cleaned = 0;

  for (const item of attachmentQueueItems) {
    const attachmentId = attachmentIdFromQueuePayload(item.payload);
    if (!attachmentId) {
      await db.delete('sync_queue', item.id);
      cleaned += 1;
      continue;
    }

    const [localAttachment, pendingFile] = await Promise.all([db.get('attachments', attachmentId), db.get('pending_attachment_files', attachmentId)]);
    if (!localAttachment && !pendingFile) {
      await db.delete('sync_queue', item.id);
      cleaned += 1;
    }
  }

  if (cleaned > 0) {
    emitSyncQueueChanged();
  }

  return cleaned;
}

export async function getLastAttachmentSyncAt(userId: string) {
  const db = await localDbPromise;
  const record = await db.get('app_cache', `attachments:last-sync:${userId}`);
  return typeof record?.value === 'string' ? record.value : null;
}

export async function createAttachment(
  userId: string,
  file: File,
  owner?: { ownerType: AttachmentOwnerType; ownerId: string }
) {
  const id = generateId();
  const timestamp = nowIso();
  const image = await processImage(file);
  const { storagePath, thumbnailPath } = pathsFor(userId, id, file.name);
  const attachment: Attachment = {
    id,
    user_id: userId,
    filename: safeFileName(file.name),
    original_filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size,
    width: image.width,
    height: image.height,
    storage_path: storagePath,
    thumbnail_path: image.thumbnail ? thumbnailPath : null,
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: navigator.onLine ? 'uploading' : 'pending',
    error_message: null
  };

  const pending: PendingAttachmentFile = {
    attachment_id: id,
    user_id: userId,
    file,
    thumbnail: image.thumbnail,
    created_at: timestamp
  };

  const payload: AttachmentPayload = {
    attachment,
    link: owner
      ? {
          user_id: userId,
          attachment_id: id,
          owner_type: owner.ownerType,
          owner_id: owner.ownerId
        }
      : undefined
  };

  if (owner?.ownerType === 'topic') {
    payload.topicAttachment = createTopicAttachment(userId, owner.ownerId, id);
  }

  if (owner?.ownerType === 'medication') {
    payload.medicationAttachment = createMedicationAttachment(userId, owner.ownerId, id);
  }

  const db = await localDbPromise;
  await db.put('attachments', attachment);
  await db.put('pending_attachment_files', pending);
  if (payload.topicAttachment) {
    await db.put('topic_attachments', payload.topicAttachment);
  }
  if (payload.medicationAttachment) {
    await db.put('medication_attachments', payload.medicationAttachment);
  }

  if (navigator.onLine) {
    try {
      await pushAttachmentToSupabase(payload);
    } catch (error) {
      await db.put('attachments', { ...attachment, sync_status: 'error', error_message: error instanceof Error ? error.message : 'Error al subir.' });
      await enqueueAttachment(userId, 'upsert', payload);
    }
  } else {
    await enqueueAttachment(userId, 'upsert', payload);
  }

  return attachment;
}

export async function renameAttachment(userId: string, attachment: Attachment, filename: string) {
  const updated: Attachment = { ...attachment, filename: safeFileName(filename), updated_at: nowIso(), sync_status: navigator.onLine ? 'uploading' : 'pending' };
  const db = await localDbPromise;
  await db.put('attachments', updated);
  const payload = { attachment: updated };

  if (navigator.onLine) {
    try {
      await pushAttachmentToSupabase(payload);
    } catch {
      await enqueueAttachment(userId, 'upsert', payload);
    }
  } else {
    await enqueueAttachment(userId, 'upsert', payload);
  }
}

export async function deleteAttachment(userId: string, attachment: Attachment) {
  const db = await localDbPromise;

  if (navigator.onLine) {
    try {
      await removeAttachmentFromLinkedTopics(userId, attachment.id);
      await removeAttachmentFromLinkedMedications(userId, attachment.id);
      await deleteLocalAttachmentRelations(userId, attachment.id);

      const { error: genericLinkError } = await supabase.from('attachment_links').delete().eq('attachment_id', attachment.id).eq('user_id', userId);
      if (genericLinkError) throw genericLinkError;

      const { error: topicLinkError } = await supabase.from('topic_attachments').delete().eq('attachment_id', attachment.id).eq('user_id', userId);
      if (topicLinkError) throw topicLinkError;

      const { error: medicationLinkError } = await supabase.from('medication_attachments').delete().eq('attachment_id', attachment.id).eq('user_id', userId);
      if (medicationLinkError) throw medicationLinkError;

      const pathsToRemove = [attachment.storage_path, attachment.thumbnail_path].filter(Boolean) as string[];
      if (pathsToRemove.length > 0) {
        const { error: storageError } = await supabase.storage.from(bucketName).remove(pathsToRemove);
        if (storageError) throw storageError;
      }

      const { error } = await supabase.from('attachments').delete().eq('id', attachment.id).eq('user_id', userId);
      if (error) throw error;
      await db.delete('attachments', attachment.id);
      await db.delete('pending_attachment_files', attachment.id);
    } catch (error) {
      console.error('ATTACHMENT_DELETE_FAILED', error);
      throw error instanceof Error ? error : new Error('No se pudo eliminar el archivo. Intentá nuevamente.');
    }
  } else {
    try {
      await deleteLocalAttachmentRelations(userId, attachment.id);
      await db.delete('attachments', attachment.id);
      await db.delete('pending_attachment_files', attachment.id);
      await enqueueAttachment(userId, 'delete', { id: attachment.id, user_id: userId });
    } catch (error) {
      console.error('ATTACHMENT_DELETE_QUEUE_FAILED', error);
      throw error instanceof Error ? error : new Error('No se pudo dejar la eliminación pendiente.');
    }
  }
}

export async function linkAttachmentToTopic(userId: string, topicId: string, attachmentId: string) {
  const link = createTopicAttachment(userId, topicId, attachmentId);
  const db = await localDbPromise;
  await db.put('topic_attachments', link);

  const attachment = await db.get('attachments', attachmentId);
  if (!attachment) return;

  const payload: AttachmentPayload = {
    attachment,
    topicAttachment: link,
    link: {
      user_id: userId,
      attachment_id: attachmentId,
      owner_type: 'topic',
      owner_id: topicId
    }
  };

  if (navigator.onLine) {
    try {
      await pushAttachmentToSupabase(payload);
    } catch {
      await enqueueAttachment(userId, 'upsert', payload);
    }
  } else {
    await enqueueAttachment(userId, 'upsert', payload);
  }
}

export async function linkAttachmentToMedication(userId: string, medicationId: string, attachmentId: string) {
  const link = createMedicationAttachment(userId, medicationId, attachmentId);
  const db = await localDbPromise;
  await db.put('medication_attachments', link);

  const attachment = await db.get('attachments', attachmentId);
  if (!attachment) return;

  const payload: AttachmentPayload = {
    attachment,
    medicationAttachment: link,
    link: {
      user_id: userId,
      attachment_id: attachmentId,
      owner_type: 'medication',
      owner_id: medicationId
    }
  };

  if (navigator.onLine) {
    try {
      await pushAttachmentToSupabase(payload);
    } catch {
      await enqueueAttachment(userId, 'upsert', payload);
    }
  } else {
    await enqueueAttachment(userId, 'upsert', payload);
  }
}

export async function getAttachmentUsageSummary(userId: string, attachmentId: string): Promise<AttachmentUsageSummary> {
  const db = await localDbPromise;
  const topicCount = (await db.getAllFromIndex('topic_attachments', 'attachment_id', attachmentId)).filter((item) => item.user_id === userId).length;
  const medicationCount = (await db.getAllFromIndex('medication_attachments', 'attachment_id', attachmentId)).filter(
    (item) => item.user_id === userId
  ).length;
  const local = { topics: topicCount, medications: medicationCount };

  if (!navigator.onLine) return { ...local, total: local.topics + local.medications };

  try {
    const [topicResult, medicationResult] = await Promise.all([
      supabase
        .from('topic_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('attachment_id', attachmentId)
        .eq('user_id', userId),
      supabase
        .from('medication_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('attachment_id', attachmentId)
        .eq('user_id', userId)
    ]);
    if (topicResult.error) throw topicResult.error;
    if (medicationResult.error) throw medicationResult.error;
    const topics = Math.max(local.topics, topicResult.count ?? 0);
    const medications = Math.max(local.medications, medicationResult.count ?? 0);
    return { topics, medications, total: topics + medications };
  } catch {
    return { ...local, total: local.topics + local.medications };
  }
}

export async function getAttachmentUsageCount(userId: string, attachmentId: string) {
  return (await getAttachmentUsageSummary(userId, attachmentId)).total;
}

export async function diagnoseAttachmentReconciliation(userId: string): Promise<AttachmentReconciliationReport> {
  const db = await localDbPromise;
  const localAttachments = await db.getAllFromIndex('attachments', 'user_id', userId);
  const localTopicLinks = await db.getAllFromIndex('topic_attachments', 'user_id', userId);
  const localMedicationLinks = await db.getAllFromIndex('medication_attachments', 'user_id', userId);

  if (!navigator.onLine) {
    return {
      localOnly: localAttachments.length,
      remoteOnly: 0,
      invalidStoragePath: 0,
      remoteLinksMissingLocally: 0,
      storageObjectsWithoutRecord: 0
    };
  }

  const [attachmentsResult, topicLinksResult, medicationLinksResult, storageResult] = await Promise.all([
    supabase.from('attachments').select('*').eq('user_id', userId),
    supabase.from('topic_attachments').select('*').eq('user_id', userId),
    supabase.from('medication_attachments').select('*').eq('user_id', userId),
    supabase.storage.from(bucketName).list(userId, { limit: 1000 })
  ]);

  const firstError = attachmentsResult.error ?? topicLinksResult.error ?? medicationLinksResult.error ?? storageResult.error;
  if (firstError) throw firstError;

  const remoteAttachments = (attachmentsResult.data ?? []) as Attachment[];
  const remoteIds = new Set(remoteAttachments.map((item) => item.id));
  const localIds = new Set(localAttachments.map((item) => item.id));
  const localTopicLinkIds = new Set(localTopicLinks.map((item) => item.id));
  const localMedicationLinkIds = new Set(localMedicationLinks.map((item) => item.id));
  const remoteTopicLinks = (topicLinksResult.data ?? []) as TopicAttachment[];
  const remoteMedicationLinks = (medicationLinksResult.data ?? []) as MedicationAttachment[];

  return {
    localOnly: localAttachments.filter((item) => !remoteIds.has(item.id)).length,
    remoteOnly: remoteAttachments.filter((item) => !localIds.has(item.id)).length,
    invalidStoragePath: remoteAttachments.filter((item) => !item.storage_path.startsWith(`${userId}/`)).length,
    remoteLinksMissingLocally:
      remoteTopicLinks.filter((item) => !localTopicLinkIds.has(item.id)).length +
      remoteMedicationLinks.filter((item) => !localMedicationLinkIds.has(item.id)).length,
    storageObjectsWithoutRecord: (storageResult.data ?? []).filter((item) => !remoteIds.has(item.name)).length
  };
}

async function deleteLocalAttachmentRelations(userId: string, attachmentId: string) {
  const db = await localDbPromise;
  const [topicLinks, medicationLinks, genericLinks] = await Promise.all([
    db.getAllFromIndex('topic_attachments', 'attachment_id', attachmentId),
    db.getAllFromIndex('medication_attachments', 'attachment_id', attachmentId),
    db.getAllFromIndex('attachment_links', 'attachment_id', attachmentId)
  ]);
  const tx = db.transaction(['topic_attachments', 'medication_attachments', 'attachment_links'], 'readwrite');
  await Promise.all(topicLinks.filter((item) => item.user_id === userId).map((item) => tx.objectStore('topic_attachments').delete(item.id)));
  await Promise.all(medicationLinks.filter((item) => item.user_id === userId).map((item) => tx.objectStore('medication_attachments').delete(item.id)));
  await Promise.all(genericLinks.filter((item) => item.user_id === userId).map((item) => tx.objectStore('attachment_links').delete(item.id)));
  await tx.done;
}

function removeAttachmentNodes(document: unknown, attachmentId: string): { document: unknown; changed: boolean } {
  if (!document || typeof document !== 'object') return { document, changed: false };
  const node = document as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };
  if (node.type === 'medicalImage' && node.attrs?.attachmentId === attachmentId) {
    return { document: null, changed: true };
  }

  if (!Array.isArray(node.content)) return { document, changed: false };

  let changed = false;
  const content = node.content
    .map((child) => {
      const result = removeAttachmentNodes(child, attachmentId);
      changed = changed || result.changed;
      return result.document;
    })
    .filter(Boolean);

  return changed ? { document: { ...node, content }, changed } : { document, changed: false };
}

async function removeAttachmentFromLinkedTopics(userId: string, attachmentId: string) {
  const db = await localDbPromise;
  if (navigator.onLine) {
    const { data, error } = await supabase.from('topic_attachments').select('*').eq('attachment_id', attachmentId).eq('user_id', userId);
    if (error) throw error;
    await Promise.all(((data ?? []) as TopicAttachment[]).map((item) => db.put('topic_attachments', item)));
  }

  const links = (await db.getAllFromIndex('topic_attachments', 'attachment_id', attachmentId)).filter((item) => item.user_id === userId);
  if (links.length === 0) return;
  const topicIds = [...new Set(links.map((item) => item.topic_id))];

  for (const topicId of topicIds) {
    let topic: Topic | undefined = await db.get('topics', topicId);
    if (!topic && navigator.onLine) {
      const { data, error } = await supabase.from('topics').select('*').eq('id', topicId).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        topic = data as Topic;
        await db.put('topics', topic);
      }
    }
    if (!topic) continue;
    const result = removeAttachmentNodes(topic.content_json, attachmentId);
    if (!result.changed) continue;
    const updated = { ...topic, content_json: result.document as typeof topic.content_json, updated_at: nowIso() };
    await db.put('topics', updated);
    const { error } = await supabase
      .from('topics')
      .update({ content_json: updated.content_json as Json, updated_at: updated.updated_at })
      .eq('id', topicId)
      .eq('user_id', userId);
    if (error) throw error;
  }
}

async function removeAttachmentFromLinkedMedications(userId: string, attachmentId: string) {
  const db = await localDbPromise;
  if (navigator.onLine) {
    const { data, error } = await supabase.from('medication_attachments').select('*').eq('attachment_id', attachmentId).eq('user_id', userId);
    if (error) throw error;
    await Promise.all(((data ?? []) as MedicationAttachment[]).map((item) => db.put('medication_attachments', item)));
  }

  const links = (await db.getAllFromIndex('medication_attachments', 'attachment_id', attachmentId)).filter((item) => item.user_id === userId);
  const medicationIds = [...new Set(links.map((item) => item.medication_id))];

  for (const medicationId of medicationIds) {
    let medication: Medication | undefined = await db.get('medications', medicationId);
    if (!medication && navigator.onLine) {
      const { data, error } = await supabase.from('medications').select('*').eq('id', medicationId).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        medication = data as Medication;
        await db.put('medications', medication);
      }
    }
    if (!medication) continue;

    let changed = false;
    const updated = { ...medication, updated_at: nowIso() };
    for (const field of medicationAttachmentFields) {
      const result = removeAttachmentNodes(updated[field], attachmentId);
      if (result.changed) {
        updated[field] = result.document as (typeof updated)[typeof field];
        changed = true;
      }
    }
    if (!changed) continue;
    await db.put('medications', updated);
    const changes = medicationAttachmentFields.reduce(
      (payload, field) => ({ ...payload, [field]: updated[field] as Json }),
      { updated_at: updated.updated_at } as Record<string, Json | string>
    );
    const { error } = await supabase.from('medications').update(changes as never).eq('id', medicationId).eq('user_id', userId);
    if (error) throw error;
  }
}

export async function getSignedAttachmentUrl(attachment: Attachment, thumbnail = false) {
  const path = thumbnail && attachment.thumbnail_path ? attachment.thumbnail_path : attachment.storage_path;
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function getAttachmentDisplayUrl(attachment: Attachment) {
  const pending = await getAttachmentFile(attachment.id);
  if (pending) {
    return URL.createObjectURL(pending.file);
  }

  return getSignedAttachmentUrl(attachment);
}

export async function flushAttachmentQueueItem(item: { action: SyncAction; payload: unknown; user_id: string }) {
  if (item.action === 'delete') {
    const payload = item.payload as { id: string; user_id: string };
    const { data } = await supabase.from('attachments').select('storage_path, thumbnail_path').eq('id', payload.id).eq('user_id', item.user_id).single();
    await supabase.from('attachment_links').delete().eq('attachment_id', payload.id).eq('user_id', item.user_id);
    await supabase.from('topic_attachments').delete().eq('attachment_id', payload.id).eq('user_id', item.user_id);
    await supabase.from('medication_attachments').delete().eq('attachment_id', payload.id).eq('user_id', item.user_id);
    if (data) {
      await supabase.storage.from(bucketName).remove([data.storage_path, data.thumbnail_path].filter(Boolean) as string[]);
    }
    const { error } = await supabase.from('attachments').delete().eq('id', payload.id).eq('user_id', item.user_id);
    if (error) throw error;
    return;
  }

  await pushAttachmentToSupabase(item.payload as AttachmentPayload);
}

export async function attachmentToInternalLink(attachment: Attachment) {
  return `attachment://${attachment.id}`;
}

export function isImageAttachment(attachment: Attachment) {
  return attachment.mime_type.startsWith('image/');
}

export function attachmentForSupabaseJson(attachment: Attachment): Json {
  return attachment as unknown as Json;
}
