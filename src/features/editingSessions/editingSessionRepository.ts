import { localDbPromise } from '../../storage/localDb';
import type { EditingSession, EditingSessionEntityType, EditingSessionInput } from '../../types/editingSession';

export const editingSessionSchemaVersion = 1;

export function buildEditingSessionKey({
  userId,
  entityType,
  entityId,
  draftId
}: {
  userId: string;
  entityType: EditingSessionEntityType;
  entityId?: string | null;
  draftId?: string | null;
}) {
  const target = entityId ? entityId : `new:${draftId}`;
  return `editing-session:${userId}:${entityType}:${target}`;
}

export async function saveEditingSession<TFormData>(input: EditingSessionInput<TFormData>) {
  const db = await localDbPromise;
  const session: EditingSession<TFormData> = {
    key: buildEditingSessionKey(input),
    user_id: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    draft_id: input.draftId ?? null,
    route: input.route,
    form_data: input.formData,
    scroll_y: input.scrollY ?? window.scrollY ?? 0,
    updated_at: new Date().toISOString(),
    base_record_updated_at: input.baseRecordUpdatedAt ?? null,
    schema_version: editingSessionSchemaVersion
  };

  await db.put('editing_sessions', session);
  return session;
}

export async function getEditingSession<TFormData>(key: string) {
  const db = await localDbPromise;
  return (await db.get('editing_sessions', key)) as EditingSession<TFormData> | undefined;
}

export async function deleteEditingSession(key: string) {
  const db = await localDbPromise;
  await db.delete('editing_sessions', key);
}

export async function getLatestEditingSessionForUser(userId: string) {
  const db = await localDbPromise;
  const sessions = await db.getAllFromIndex('editing_sessions', 'user_id', userId);
  return sessions
    .filter((session) => session.schema_version === editingSessionSchemaVersion)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
}
