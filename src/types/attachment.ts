export type AttachmentOwnerType = 'topic' | 'medication' | 'protocol' | 'flashcard' | 'clinical_case' | 'scale' | 'algorithm';
export type AttachmentSyncStatus = 'pending' | 'uploading' | 'synced' | 'error';
export type AttachmentViewMode = 'grid' | 'list';

export type Attachment = {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  storage_path: string;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
  sync_status?: AttachmentSyncStatus;
  error_message?: string | null;
};

export type AttachmentLink = {
  id: string;
  user_id: string;
  attachment_id: string;
  owner_type: AttachmentOwnerType;
  owner_id: string;
  created_at: string;
};

export type TopicAttachment = {
  id: string;
  user_id: string;
  topic_id: string;
  attachment_id: string;
  created_at: string;
};

export type PendingAttachmentFile = {
  attachment_id: string;
  user_id: string;
  file: Blob;
  thumbnail?: Blob;
  created_at: string;
};
