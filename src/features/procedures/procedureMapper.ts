import type { Json } from '../../types/database';
import type { Procedure } from '../../types/procedure';
import type { TipTapDocument } from '../../types/topic';
import { getTopicDocument } from '../topics/tiptapDocument';
import { procedureStudySections } from './procedureSectionCatalog';

type ProcedureStudyJsonField = (typeof procedureStudySections)[number]['jsonField'];
type ProcedureStudyHtmlField = (typeof procedureStudySections)[number]['htmlField'];
type ProcedureStudySource = Partial<Record<ProcedureStudyJsonField | ProcedureStudyHtmlField, unknown>>;

export type SupabaseProcedureRecord = ProcedureStudySource & {
  id?: string;
  user_id?: string;
  title?: string | null;
  name?: string | null;
  summary?: string | null;
  category?: string | null;
  status?: string | null;
  is_favorite?: boolean | null;
  search_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseProcedurePayload = Omit<Procedure, 'name' | 'category' | ProcedureStudyJsonField> & {
  title: string;
  category: string;
} & Record<ProcedureStudyJsonField, Json>;

const defaultProcedureCategory = 'Sin categoría';
const emptyTipTapHtml = '<p></p>';

export function normalizeProcedureCategory(value?: string | null) {
  return value?.trim() || defaultProcedureCategory;
}

export function getProcedureDisplayName(procedure: Pick<Procedure, 'name'> & { title?: string | null }) {
  return procedure.name?.trim() || procedure.title?.trim() || 'Procedimiento sin nombre';
}

export function procedureStudyValues(source: ProcedureStudySource) {
  return procedureStudySections.reduce(
    (fields, section) => ({
      ...fields,
      [section.jsonField]: getTopicDocument(source[section.jsonField] as TipTapDocument | null | undefined),
      [section.htmlField]: typeof source[section.htmlField] === 'string' && source[section.htmlField] ? source[section.htmlField] : emptyTipTapHtml
    }),
    {} as Pick<Procedure, ProcedureStudyJsonField | ProcedureStudyHtmlField>
  );
}

export function procedureFromSupabase(record: SupabaseProcedureRecord): Procedure {
  const timestamp = new Date().toISOString();

  return {
    ...(record as Procedure),
    id: record.id ?? '',
    user_id: record.user_id ?? '',
    name: getProcedureDisplayName({ name: record.name ?? '', title: record.title }),
    summary: record.summary ?? null,
    category: normalizeProcedureCategory(record.category),
    status: record.status === 'complete' ? 'complete' : 'draft',
    is_favorite: Boolean(record.is_favorite),
    search_text: record.search_text ?? '',
    created_at: record.created_at ?? timestamp,
    updated_at: record.updated_at ?? timestamp,
    ...procedureStudyValues(record)
  };
}

export function procedureToSupabase(procedure: Procedure): SupabaseProcedurePayload {
  return {
    id: procedure.id,
    user_id: procedure.user_id,
    title: getProcedureDisplayName(procedure),
    summary: procedure.summary,
    category: normalizeProcedureCategory(procedure.category),
    status: procedure.status,
    is_favorite: procedure.is_favorite,
    technique_json: getTopicDocument(procedure.technique_json) as Json,
    technique_html: procedure.technique_html || emptyTipTapHtml,
    considerations_json: getTopicDocument(procedure.considerations_json) as Json,
    considerations_html: procedure.considerations_html || emptyTipTapHtml,
    search_text: procedure.search_text ?? '',
    created_at: procedure.created_at,
    updated_at: procedure.updated_at
  };
}
