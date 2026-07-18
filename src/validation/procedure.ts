import { z } from 'zod';
import type { TipTapDocument } from '../types/topic';

const richField = z.custom<TipTapDocument>((value) => Boolean(value && typeof value === 'object'), 'El contenido enriquecido no es válido.');

export const procedureSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'El nombre del procedimiento es obligatorio.'),
  summary: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  status: z.enum(['draft', 'complete']),
  is_favorite: z.boolean().default(false),
  tag_ids: z.array(z.string()).default([]),
  technique_json: richField,
  technique_html: z.string().default('<p></p>'),
  considerations_json: richField,
  considerations_html: z.string().default('<p></p>')
});
