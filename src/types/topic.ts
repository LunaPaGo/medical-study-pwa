export type TopicStatus = 'draft' | 'complete';
export type TopicSort = 'updated_desc' | 'title_asc';
export type SyncEntity = 'topic' | 'folder' | 'category' | 'tag' | 'attachment' | 'medication' | 'procedure';
export type SyncAction = 'upsert' | 'delete';
export type TopicSectionKey = 'definition_epidemiology' | 'clinical' | 'diagnosis_criteria' | 'treatment_management' | 'differential_diagnosis';
export type TopicRelationType =
  | 'related'
  | 'differential_diagnosis'
  | 'complication'
  | 'cause'
  | 'treatment'
  | 'pharmacology'
  | 'procedure'
  | 'other';

export type TipTapDocument = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapDocument[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  [key: string]: unknown;
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = Folder;
export type Tag = Folder;

export type Topic = {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  content_json: TipTapDocument;
  content_html: string;
  definition_epidemiology_json: TipTapDocument;
  definition_epidemiology_html: string;
  clinical_json: TipTapDocument;
  clinical_html: string;
  diagnosis_criteria_json: TipTapDocument;
  diagnosis_criteria_html: string;
  treatment_management_json: TipTapDocument;
  treatment_management_html: string;
  differential_diagnosis_json: TipTapDocument;
  differential_diagnosis_html: string;
  folder_id: string | null;
  category_id: string | null;
  specialty: string | null;
  status: TopicStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type TopicTag = {
  topic_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
};

export type TopicRelation = {
  id: string;
  user_id: string;
  source_topic_id: string;
  target_topic_id: string;
  relation_type: TopicRelationType;
  created_at: string;
  updated_at: string;
};

export type TopicRelationWithTopic = TopicRelation & {
  relatedTopic: Topic;
  direction: 'direct' | 'inverse';
};

export type TopicWithRelations = Topic & {
  folder?: Folder | null;
  category?: Category | null;
  tags: Tag[];
  relatedTopics: TopicRelationWithTopic[];
};

export type TopicFormValues = {
  id?: string;
  title: string;
  subtitle: string;
  content_json: TipTapDocument;
  content_html: string;
  definition_epidemiology_json: TipTapDocument;
  definition_epidemiology_html: string;
  clinical_json: TipTapDocument;
  clinical_html: string;
  diagnosis_criteria_json: TipTapDocument;
  diagnosis_criteria_html: string;
  treatment_management_json: TipTapDocument;
  treatment_management_html: string;
  differential_diagnosis_json: TipTapDocument;
  differential_diagnosis_html: string;
  folder_id: string;
  category_id: string;
  tag_ids: string[];
  specialty: string;
  status: TopicStatus;
  is_favorite: boolean;
};

export type OrganizationKind = 'folders' | 'categories' | 'tags';

export type SyncQueueItem = {
  id: string;
  user_id: string;
  entity: SyncEntity;
  action: SyncAction;
  payload: unknown;
  created_at: string;
  attempt_count?: number;
  last_attempt_at?: string;
  last_error?: string;
  retry_after?: string;
};
