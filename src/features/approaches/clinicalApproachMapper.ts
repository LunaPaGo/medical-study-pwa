import type { Json, Database } from '../../types/database';
import { isClinicalApproachRecordV1, type ClinicalApproachRecordV1 } from './clinicalApproachPersistence';

export type RemoteClinicalApproachRow = Database['public']['Tables']['approaches']['Row'];

export function clinicalApproachToRemote(record: ClinicalApproachRecordV1): Database['public']['Tables']['approaches']['Insert'] {
  return {
    id: record.id,
    user_id: record.user_id,
    title: record.title,
    description: record.description,
    category_id: record.category_id,
    status: record.status,
    content_json: record.content_json as unknown as Json,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}

export function clinicalApproachFromRemote(row: RemoteClinicalApproachRow): ClinicalApproachRecordV1 {
  const record: unknown = {
    ...row,
    content_json: row.content_json,
    remote_synced_at: new Date().toISOString()
  };
  if (!isClinicalApproachRecordV1(record)) {
    const version = (row.content_json as { version?: unknown } | null)?.version;
    throw new Error(`Versión remota de Approach no compatible: ${String(version)}.`);
  }
  return record;
}
