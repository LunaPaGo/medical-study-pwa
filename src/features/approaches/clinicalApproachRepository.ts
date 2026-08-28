import { checkSupabaseConnectivity, withTimeout } from '../../services/connectivity';
import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Category, SyncQueueItem } from '../../types/topic';
import { clinicalApproachFromRemote, clinicalApproachToRemote } from './clinicalApproachMapper';
import { isClinicalApproachRecordV1, type ClinicalApproachRecordV1 } from './clinicalApproachPersistence';
import type { ClinicalApproach } from './clinicalApproachTypes';

export type ClinicalApproachQueuePayload = { approach: ClinicalApproachRecordV1 };
type ClinicalApproachDeletePayload = { id: string; user_id: string };

export class UnsupportedClinicalApproachVersionError extends Error {
  constructor(public readonly approachId: string, public readonly version: unknown) {
    super(`El abordaje ${approachId} usa una versión de contenido no compatible (${String(version)}).`);
    this.name = 'UnsupportedClinicalApproachVersionError';
  }
}

function emitSyncQueueChanged() { window.dispatchEvent(new Event('sync-queue-changed')); }

function assertRecordV1(value: unknown): asserts value is ClinicalApproachRecordV1 {
  if (isClinicalApproachRecordV1(value)) return;
  const candidate = value as { id?: unknown; content_json?: { version?: unknown } } | null;
  throw new UnsupportedClinicalApproachVersionError(typeof candidate?.id === 'string' ? candidate.id : 'desconocido', candidate?.content_json?.version);
}

function queueApproachId(item: SyncQueueItem) {
  if (item.entity !== 'approach') return null;
  return item.action === 'upsert'
    ? (item.payload as ClinicalApproachQueuePayload).approach.id
    : (item.payload as ClinicalApproachDeletePayload).id;
}

function makeQueueItem(userId: string, action: 'upsert' | 'delete', payload: ClinicalApproachQueuePayload | ClinicalApproachDeletePayload): SyncQueueItem {
  return { id: crypto.randomUUID(), user_id: userId, entity: 'approach', action, payload, created_at: new Date().toISOString() };
}

function toEntity(record: ClinicalApproachRecordV1, category: Category | null): ClinicalApproach {
  return { id: record.id, userId: record.user_id, title: record.title, description: record.description ?? '', categoryId: record.category_id, category, content: record.content_json, createdAt: record.created_at, updatedAt: record.updated_at, status: record.status };
}

function toRecord(userId: string, approach: ClinicalApproach, existing?: ClinicalApproachRecordV1): ClinicalApproachRecordV1 {
  const now = new Date().toISOString();
  return { id: approach.id, user_id: userId, title: approach.title, description: approach.description.trim() || null, category_id: approach.categoryId, status: approach.status, content_json: approach.content, created_at: existing?.created_at ?? approach.createdAt ?? now, updated_at: now, remote_synced_at: existing?.remote_synced_at };
}

async function getCategory(userId: string, categoryId: string | null) {
  if (!categoryId) return null;
  const db = await localDbPromise;
  const category = await db.get('categories', categoryId);
  return category?.user_id === userId ? category : null;
}

export async function listClinicalApproachCategories(userId: string) {
  const db = await localDbPromise;
  return (await db.getAllFromIndex('categories', 'user_id', userId)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function enqueueUnsyncedExistingApproaches(userId: string) {
  const db = await localDbPromise;
  const tx = db.transaction(['approaches', 'sync_queue'], 'readwrite');
  const [records, queueItems] = await Promise.all([
    tx.objectStore('approaches').index('user_id').getAll(userId),
    tx.objectStore('sync_queue').index('user_id').getAll(userId)
  ]);
  let changed = false;
  for (const record of records) {
    assertRecordV1(record);
    if (record.remote_synced_at || queueItems.some((item) => queueApproachId(item) === record.id)) continue;
    await tx.objectStore('sync_queue').put(makeQueueItem(userId, 'upsert', { approach: record }));
    changed = true;
  }
  await tx.done;
  if (changed) emitSyncQueueChanged();
}

async function getPendingApproachIds(userId: string) {
  const db = await localDbPromise;
  const items = await db.getAllFromIndex('sync_queue', 'user_id', userId);
  return new Set(items.map(queueApproachId).filter((id): id is string => Boolean(id)));
}

async function cacheRemoteApproaches(userId: string) {
  if ((await checkSupabaseConnectivity()) !== 'online') return;
  const result = await withTimeout(Promise.resolve(supabase.from('approaches').select('*').eq('user_id', userId)), 4500, 'APPROACH_REMOTE_PULL');
  if (result.error) throw result.error;
  const pendingIds = await getPendingApproachIds(userId);
  const remoteRecords: ClinicalApproachRecordV1[] = [];
  for (const row of result.data ?? []) {
    if (pendingIds.has(row.id)) continue;
    try {
      remoteRecords.push(clinicalApproachFromRemote(row));
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[approaches] remote_version_skipped', { approachId: row.id, error });
    }
  }

  const db = await localDbPromise;
  const tx = db.transaction('approaches', 'readwrite');
  const localRecords = await tx.store.index('user_id').getAll(userId);
  const remoteIds = new Set((result.data ?? []).map((row) => row.id));
  await Promise.all(remoteRecords.map((record) => tx.store.put(record)));
  await Promise.all(localRecords.filter((record) => record.remote_synced_at && !pendingIds.has(record.id) && !remoteIds.has(record.id)).map((record) => tx.store.delete(record.id)));
  await tx.done;
}

export async function listClinicalApproaches(userId: string) {
  const db = await localDbPromise;
  const rawRecords = await db.getAllFromIndex('approaches', 'user_id', userId);
  rawRecords.forEach(assertRecordV1);
  const categories = await listClinicalApproachCategories(userId);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return rawRecords.map((record) => toEntity(record, record.category_id ? categoriesById.get(record.category_id) ?? null : null)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadClinicalApproaches(userId: string, shouldSyncRemote = navigator.onLine) {
  await enqueueUnsyncedExistingApproaches(userId);
  if (shouldSyncRemote) {
    try { await cacheRemoteApproaches(userId); } catch { /* IndexedDB remains authoritative when remote access fails. */ }
  }
  return listClinicalApproaches(userId);
}

export async function getClinicalApproach(userId: string, id: string, shouldSyncRemote = navigator.onLine) {
  const approaches = await loadClinicalApproaches(userId, shouldSyncRemote);
  return approaches.find((approach) => approach.id === id);
}

async function persistApproachAndQueue(userId: string, approach: ClinicalApproach, requireExisting?: boolean) {
  if (approach.userId !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  const db = await localDbPromise;
  const tx = db.transaction(['approaches', 'sync_queue'], 'readwrite');
  const existing: unknown = await tx.objectStore('approaches').get(approach.id);
  if (requireExisting === true && !existing) throw new Error('El abordaje ya no existe.');
  if (requireExisting === false && existing) throw new Error('Ya existe un abordaje con ese identificador.');
  if (existing) {
    assertRecordV1(existing);
    if (existing.user_id !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  }
  const existingRecord = existing ? (existing as ClinicalApproachRecordV1) : undefined;
  const record = toRecord(userId, approach, existingRecord);
  const queueStore = tx.objectStore('sync_queue');
  const queuedItems = await queueStore.index('user_id').getAll(userId);
  await Promise.all(queuedItems.filter((item) => item.entity === 'approach' && item.action === 'upsert' && queueApproachId(item) === record.id).map((item) => queueStore.delete(item.id)));
  await tx.objectStore('approaches').put(record);
  await queueStore.put(makeQueueItem(userId, 'upsert', { approach: record }));
  await tx.done;
  emitSyncQueueChanged();
  return toEntity(record, await getCategory(userId, record.category_id));
}

export function createClinicalApproach(userId: string, approach: ClinicalApproach) { return persistApproachAndQueue(userId, approach, false); }
export function updateClinicalApproach(userId: string, approach: ClinicalApproach) { return persistApproachAndQueue(userId, approach, true); }
export function saveClinicalApproach(userId: string, approach: ClinicalApproach) { return persistApproachAndQueue(userId, approach); }

export async function deleteClinicalApproachLocal(userId: string, id: string) {
  const db = await localDbPromise;
  const tx = db.transaction(['approaches', 'sync_queue'], 'readwrite');
  const existing: unknown = await tx.objectStore('approaches').get(id);
  if (!existing) return;
  assertRecordV1(existing);
  if (existing.user_id !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  const queueStore = tx.objectStore('sync_queue');
  const queuedItems = await queueStore.index('user_id').getAll(userId);
  await Promise.all(queuedItems.filter((item) => item.entity === 'approach' && queueApproachId(item) === id).map((item) => queueStore.delete(item.id)));
  await tx.objectStore('approaches').delete(id);
  await queueStore.put(makeQueueItem(userId, 'delete', { id, user_id: userId }));
  await tx.done;
  emitSyncQueueChanged();
}

async function markApproachSynced(userId: string, payload: ClinicalApproachQueuePayload) {
  const db = await localDbPromise;
  const current = await db.get('approaches', payload.approach.id);
  if (current?.user_id === userId && current.updated_at === payload.approach.updated_at) {
    await db.put('approaches', { ...current, remote_synced_at: new Date().toISOString() });
  }
}

export async function flushClinicalApproachQueueItem(item: SyncQueueItem) {
  if (item.action === 'delete') {
    const payload = item.payload as ClinicalApproachDeletePayload;
    const result = await withTimeout(Promise.resolve(supabase.from('approaches').delete().eq('id', payload.id).eq('user_id', item.user_id)), 4500, 'APPROACH_REMOTE_DELETE');
    if (result.error) throw result.error;
    return;
  }
  const payload = item.payload as ClinicalApproachQueuePayload;
  assertRecordV1(payload.approach);
  const result = await withTimeout(Promise.resolve(supabase.from('approaches').upsert(clinicalApproachToRemote(payload.approach))), 4500, 'APPROACH_REMOTE_UPSERT');
  if (result.error) throw result.error;
  await markApproachSynced(item.user_id, payload);
}
