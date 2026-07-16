import { supabase } from '../../services/supabase';
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
import type { SyncAction } from '../../types/topic';
import { processImage } from './imageProcessing';

const bucketName = 'study-attachments';

type AttachmentPayload = {
  attachment: Attachment;
  link?: Omit<AttachmentLink, 'id' | 'created_at'>;
  topicAttachment?: TopicAttachment;
  medicationAttachment?: MedicationAttachment;
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
  return {
    storagePath: `${userId}/originals/${attachmentId}${ext}`,
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
      const { data, error } = await supabase.from('attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      await Promise.all((data ?? []).map((item) => db.put('attachments', { ...(item as Attachment), sync_status: 'synced' })));
    } catch {
      // Offline cache remains available.
    }
  }

  return (await db.getAllFromIndex('attachments', 'user_id', userId)).sort((a, b) => b.created_at.localeCompare(a.created_at));
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
  if (pending) {
    await uploadAttachmentFiles(payload.attachment, pending);
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
  if (error) throw error;

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
  const usageCount = await getAttachmentUsageCount(userId, attachment.id);
  if (usageCount > 0) {
    throw new Error(`Este archivo está usado en ${usageCount} elemento(s). Quitalo primero del contenido antes de eliminarlo definitivamente.`);
  }

  const db = await localDbPromise;
  await db.delete('attachments', attachment.id);
  await db.delete('pending_attachment_files', attachment.id);

  if (navigator.onLine) {
    try {
      await supabase.storage.from(bucketName).remove([attachment.storage_path, attachment.thumbnail_path].filter(Boolean) as string[]);
      const { error } = await supabase.from('attachments').delete().eq('id', attachment.id).eq('user_id', userId);
      if (error) throw error;
    } catch {
      await enqueueAttachment(userId, 'delete', { id: attachment.id, user_id: userId });
    }
  } else {
    await enqueueAttachment(userId, 'delete', { id: attachment.id, user_id: userId });
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

export async function getAttachmentUsageCount(userId: string, attachmentId: string) {
  const db = await localDbPromise;
  const topicCount = (await db.getAllFromIndex('topic_attachments', 'attachment_id', attachmentId)).filter((item) => item.user_id === userId).length;
  const medicationCount = (await db.getAllFromIndex('medication_attachments', 'attachment_id', attachmentId)).filter(
    (item) => item.user_id === userId
  ).length;
  const localCount = topicCount + medicationCount;

  if (!navigator.onLine) return localCount;

  try {
    const { count, error } = await supabase
      .from('attachment_links')
      .select('id', { count: 'exact', head: true })
      .eq('attachment_id', attachmentId)
      .eq('user_id', userId);
    if (error) throw error;
    return Math.max(localCount, count ?? 0);
  } catch {
    return localCount;
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
