import { z } from 'zod';
import type { TipTapDocument } from '../types/topic';

export const topicSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  subtitle: z.string().trim().optional().default(''),
  content_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'El documento del editor no es válido.'),
  content_html: z.string().trim().min(1, 'El contenido es obligatorio.'),
  definition_epidemiology_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'La sección Definición y Epidemiología no es válida.'),
  definition_epidemiology_html: z.string().default('<p></p>'),
  clinical_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'La sección Clínica no es válida.'),
  clinical_html: z.string().default('<p></p>'),
  diagnosis_criteria_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'La sección Diagnóstico y Criterios no es válida.'),
  diagnosis_criteria_html: z.string().default('<p></p>'),
  treatment_management_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'La sección Tratamiento y Manejo no es válida.'),
  treatment_management_html: z.string().default('<p></p>'),
  differential_diagnosis_json: z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'La sección Diagnóstico Diferencial no es válida.'),
  differential_diagnosis_html: z.string().default('<p></p>'),
  folder_id: z.string().optional().default(''),
  category_id: z.string().optional().default(''),
  tag_ids: z.array(z.string()).default([]),
  specialty: z.string().trim().optional().default(''),
  status: z.enum(['draft', 'complete']),
  is_favorite: z.boolean().default(false)
});

export const organizationSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  color: z.string().trim().optional().default('')
});
