import { z } from 'zod';
import type { TipTapDocument } from '../types/topic';

const richField = z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'El contenido enriquecido no es válido.');

export const medicationSchema = z.object({
  id: z.string().optional(),
  generic_name: z.string().trim().optional().default(''),
  pharmacologic_group: z.string().trim().optional().default(''),
  pharmacologic_subgroup: z.string().trim().optional().default(''),
  short_description: z.string().trim().optional().default(''),
  status: z.enum(['draft', 'complete']),
  is_favorite: z.boolean().default(false),
  tag_ids: z.array(z.string()).default([]),
  mechanism_of_action: richField,
  therapeutic_targets: richField,
  pharmacologic_effects: richField,
  indications: richField,
  clinical_application: richField,
  adult_dose: richField,
  pediatric_dose: richField,
  dose_and_dilution: richField,
  administration: richField,
  onset_time: richField,
  transport: richField,
  metabolism: richField,
  elimination: richField,
  adverse_effects: richField,
  contraindications: richField,
  antidote: richField,
  personal_notes: richField,
  bibliography: richField,
  classification_mechanism_json: richField,
  classification_mechanism_html: z.string().default('<p></p>'),
  clinical_uses_json: richField,
  clinical_uses_html: z.string().default('<p></p>'),
  dosing_administration_json: richField,
  dosing_administration_html: z.string().default('<p></p>'),
  safety_json: richField,
  safety_html: z.string().default('<p></p>')
});
