import type { Attachment, ProcedureAttachment } from './attachment';
import type { Tag, TipTapDocument } from './topic';

export type ProcedureStatus = 'draft' | 'complete';
export type ProcedureSort = 'name_asc' | 'updated_desc' | 'created_desc' | 'favorite_desc';

export type ProcedureStudySectionKey = 'technique' | 'considerations';

export type ProcedureStudySections = {
  technique_json: TipTapDocument;
  technique_html: string;
  considerations_json: TipTapDocument;
  considerations_html: string;
};

export type Procedure = ProcedureStudySections & {
  id: string;
  user_id: string;
  name: string;
  summary: string | null;
  category: string | null;
  status: ProcedureStatus;
  is_favorite: boolean;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type ProcedureTag = {
  procedure_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
};

export type ProcedureWithRelations = Procedure & {
  tags: Tag[];
  attachments: Attachment[];
};

export type ProcedureFormValues = ProcedureStudySections & {
  id?: string;
  name: string;
  summary: string;
  category: string;
  status: ProcedureStatus;
  is_favorite: boolean;
  tag_ids: string[];
};

export type ProcedureFilterOptions = {
  search: string;
  category: string;
  tagId: string;
  favoriteOnly: boolean;
  status: '' | ProcedureStatus;
  sort: ProcedureSort;
};

export type ProcedureAttachmentWithFile = ProcedureAttachment & {
  attachment?: Attachment;
};
