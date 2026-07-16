import type { Attachment } from './attachment';
import type { Tag, TipTapDocument } from './topic';

export type MedicationStatus = 'draft' | 'complete';
export type MedicationSort = 'generic_name_asc' | 'updated_desc' | 'created_desc' | 'favorite_desc';
export type MedicationViewMode = 'grid' | 'list';

export type MedicationRichField =
  | 'mechanism_of_action'
  | 'therapeutic_targets'
  | 'pharmacologic_effects'
  | 'indications'
  | 'clinical_application'
  | 'adult_dose'
  | 'pediatric_dose'
  | 'dose_and_dilution'
  | 'administration'
  | 'onset_time'
  | 'transport'
  | 'metabolism'
  | 'elimination'
  | 'adverse_effects'
  | 'contraindications'
  | 'antidote'
  | 'personal_notes'
  | 'bibliography';

export type MedicationRichFields = Record<MedicationRichField, TipTapDocument>;

export type Medication = MedicationRichFields & {
  id: string;
  user_id: string;
  generic_name: string | null;
  pharmacologic_group: string | null;
  pharmacologic_subgroup: string | null;
  short_description: string | null;
  status: MedicationStatus;
  is_favorite: boolean;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type MedicationTag = {
  medication_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
};

export type MedicationAttachment = {
  id: string;
  user_id: string;
  medication_id: string;
  attachment_id: string;
  created_at: string;
};

export type MedicationWithRelations = Medication & {
  tags: Tag[];
  attachments: Attachment[];
};

export type MedicationFormValues = Partial<MedicationRichFields> & {
  id?: string;
  generic_name: string;
  pharmacologic_group: string;
  pharmacologic_subgroup: string;
  short_description: string;
  status: MedicationStatus;
  is_favorite: boolean;
  tag_ids: string[];
};

export type MedicationFilterOptions = {
  search: string;
  group: string;
  administration: string;
  tagId: string;
  favoriteOnly: boolean;
  status: '' | MedicationStatus;
  sort: MedicationSort;
};
