export type EditingSessionEntityType = 'topic' | 'medication' | 'procedure';

export type EditingSession<TFormData = unknown> = {
  key: string;
  user_id: string;
  entity_type: EditingSessionEntityType;
  entity_id: string | null;
  draft_id: string | null;
  route: string;
  form_data: TFormData;
  scroll_y: number;
  updated_at: string;
  base_record_updated_at: string | null;
  schema_version: number;
};

export type EditingSessionInput<TFormData = unknown> = {
  userId: string;
  entityType: EditingSessionEntityType;
  entityId?: string | null;
  draftId?: string | null;
  route: string;
  formData: TFormData;
  scrollY?: number;
  baseRecordUpdatedAt?: string | null;
};
