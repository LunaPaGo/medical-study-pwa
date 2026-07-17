import type { Attachment, AttachmentLink, MedicationAttachment, TopicAttachment } from '../../types/attachment';
import type { Medication, MedicationTag } from '../../types/medication';
import type { Category, Folder, Tag, Topic, TopicTag } from '../../types/topic';

export const backupFormat = 'medical-study-pwa';
export const backupVersion = 1;

export type BackupProgressStep =
  | 'idle'
  | 'checking'
  | 'syncing'
  | 'collecting'
  | 'downloading-files'
  | 'verifying'
  | 'zipping'
  | 'done'
  | 'error';

export type BackupProgress = {
  step: BackupProgressStep;
  message: string;
  current?: number;
  total?: number;
};

export type BackupProfile = {
  user_id: string;
  display_name: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BackupData = {
  profile: BackupProfile | null;
  folders: Folder[];
  categories: Category[];
  tags: Tag[];
  topics: Topic[];
  topic_tags: TopicTag[];
  medications: Medication[];
  medication_tags: MedicationTag[];
  attachments: Attachment[];
  attachment_links: AttachmentLink[];
  topic_attachments: TopicAttachment[];
  medication_attachments: MedicationAttachment[];
};

export type BackupManifest = {
  backup_format: typeof backupFormat;
  backup_version: typeof backupVersion;
  app_version: string;
  created_at: string;
  exported_by_user_id: string;
  complete: boolean;
  counts: Record<keyof BackupData | 'files', number>;
  approximate_total_size: number;
  checksum_algorithm: 'SHA-256';
  checksums: {
    data: Record<string, string>;
    files: Record<string, string>;
  };
  files: Array<{
    attachment_id: string;
    path: string;
    original_filename: string;
    mime_type: string;
    size: number;
    source: 'supabase-storage' | 'indexeddb-local-blob';
    checksum: string;
  }>;
  warnings: string[];
};

export type BackupExportResult = {
  blob: Blob;
  filename: string;
  manifest: BackupManifest;
};

export type BackupValidationStatus = 'valid' | 'valid-with-warnings' | 'invalid';

export type BackupValidationCheck = {
  label: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
};

export type BackupValidationResult = {
  status: BackupValidationStatus;
  manifest: BackupManifest | null;
  checks: BackupValidationCheck[];
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  size: number;
};
