export type RestoreEntityName =
  | 'profile'
  | 'folders'
  | 'categories'
  | 'tags'
  | 'topics'
  | 'topic_relations'
  | 'medications'
  | 'attachments'
  | 'topic_tags'
  | 'medication_tags'
  | 'attachment_links'
  | 'topic_attachments'
  | 'medication_attachments';

export type RestoreEntitySummary = {
  created: number;
  updated: number;
  kept: number;
  skipped: number;
  conflicts: number;
  errors: string[];
};

export type RestoreFileSummary = {
  uploaded: number;
  existing: number;
  missingInZip: number;
  conflicts: number;
  failed: number;
  errors: string[];
};

export type BackupMergePreview = {
  status: 'ready' | 'ready-with-warnings' | 'blocked';
  createdAt: string;
  exportedByUserId: string;
  entities: Record<RestoreEntityName, RestoreEntitySummary>;
  files: RestoreFileSummary;
  warnings: string[];
  errors: string[];
};

export type RestoreProgressStep =
  | 'idle'
  | 'validating'
  | 'checking-current-data'
  | 'preparing-files'
  | 'restoring-data'
  | 'restoring-relations'
  | 'refreshing-local-data'
  | 'done'
  | 'error';

export type RestoreProgress = {
  step: RestoreProgressStep;
  message: string;
  current?: number;
  total?: number;
};

export type BackupMergeResult = BackupMergePreview & {
  completedAt: string;
  finalStatus: 'completed' | 'completed-with-warnings' | 'incomplete';
};
