import type { ClinicalApproachContent } from './clinicalApproachTypes';
import { isClinicalApproachContent } from './clinicalApproachCatalog';

/**
 * Future persistence boundary for the aggregate. It deliberately contains no
 * database client: one row owns one versioned clinical document, while views
 * remain projections of content_json. Tags will reuse the shared tag entities
 * through an approach-specific association rather than being embedded here.
 */
export type ClinicalApproachRecordV1 = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_json: ClinicalApproachContent;
  created_at: string;
  updated_at: string;
};

export function isClinicalApproachRecordV1(value: unknown): value is ClinicalApproachRecordV1 {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ClinicalApproachRecordV1>;
  return typeof record.id === 'string' && typeof record.user_id === 'string' && typeof record.title === 'string' && isClinicalApproachContent(record.content_json);
}
