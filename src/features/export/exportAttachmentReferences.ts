import { localDbPromise } from '../../storage/localDb';
import type { Attachment, AttachmentOwnerType } from '../../types/attachment';
import type { ExportAttachmentReference } from './exportTypes';

export async function getExportAttachmentReferences(userId: string, ownerType: 'topic' | 'medication' | 'procedure', ownerId: string) {
  const db = await localDbPromise;
  const attachments = await db.getAllFromIndex('attachments', 'user_id', userId);
  const attachmentsById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  const linkedIds = await linkedAttachmentIds(userId, ownerType, ownerId);

  return linkedIds.flatMap((attachmentId) => {
    const attachment = attachmentsById.get(attachmentId);
    return attachment ? [toAttachmentReference(attachment, ownerType, ownerId)] : [];
  });
}

function toAttachmentReference(attachment: Attachment, ownerType: AttachmentOwnerType, ownerId: string): ExportAttachmentReference {
  return {
    id: attachment.id,
    name: attachment.original_filename || attachment.filename,
    mimeType: attachment.mime_type,
    size: attachment.size,
    ownerType,
    ownerId
  };
}

async function linkedAttachmentIds(userId: string, ownerType: 'topic' | 'medication' | 'procedure', ownerId: string) {
  const db = await localDbPromise;

  if (ownerType === 'topic') {
    const links = await db.getAllFromIndex('topic_attachments', 'topic_id', ownerId);
    return links.filter((link) => link.user_id === userId).map((link) => link.attachment_id);
  }

  if (ownerType === 'medication') {
    const links = await db.getAllFromIndex('medication_attachments', 'medication_id', ownerId);
    return links.filter((link) => link.user_id === userId).map((link) => link.attachment_id);
  }

  const links = await db.getAllFromIndex('procedure_attachments', 'procedure_id', ownerId);
  return links.filter((link) => link.user_id === userId).map((link) => link.attachment_id);
}
