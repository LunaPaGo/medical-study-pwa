import { localDbPromise } from '../../storage/localDb';
import type { Category } from '../../types/topic';
import { isClinicalApproachRecordV1, type ClinicalApproachRecordV1 } from './clinicalApproachPersistence';
import type { ClinicalApproach } from './clinicalApproachTypes';

export class UnsupportedClinicalApproachVersionError extends Error {
  constructor(public readonly approachId: string, public readonly version: unknown) {
    super(`El abordaje ${approachId} usa una versión de contenido no compatible (${String(version)}).`);
    this.name = 'UnsupportedClinicalApproachVersionError';
  }
}

function assertRecordV1(value: unknown): asserts value is ClinicalApproachRecordV1 {
  if (isClinicalApproachRecordV1(value)) return;
  const candidate = value as { id?: unknown; content_json?: { version?: unknown } } | null;
  throw new UnsupportedClinicalApproachVersionError(typeof candidate?.id === 'string' ? candidate.id : 'desconocido', candidate?.content_json?.version);
}

function toEntity(record: ClinicalApproachRecordV1, category: Category | null): ClinicalApproach {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    description: record.description ?? '',
    categoryId: record.category_id,
    category,
    content: record.content_json,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    status: record.status
  };
}

function toRecord(userId: string, approach: ClinicalApproach, existing?: ClinicalApproachRecordV1): ClinicalApproachRecordV1 {
  const now = new Date().toISOString();
  return {
    id: approach.id,
    user_id: userId,
    title: approach.title,
    description: approach.description.trim() || null,
    category_id: approach.categoryId,
    status: approach.status,
    content_json: approach.content,
    created_at: existing?.created_at ?? approach.createdAt ?? now,
    updated_at: now
  };
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

export async function listClinicalApproaches(userId: string) {
  const db = await localDbPromise;
  const rawRecords = await db.getAllFromIndex('approaches', 'user_id', userId);
  rawRecords.forEach(assertRecordV1);
  const categories = await listClinicalApproachCategories(userId);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return rawRecords
    .map((record) => toEntity(record, record.category_id ? categoriesById.get(record.category_id) ?? null : null))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClinicalApproach(userId: string, id: string) {
  const db = await localDbPromise;
  const rawRecord: unknown = await db.get('approaches', id);
  if (!rawRecord) return undefined;
  assertRecordV1(rawRecord);
  if (rawRecord.user_id !== userId) return undefined;
  return toEntity(rawRecord, await getCategory(userId, rawRecord.category_id));
}

export async function createClinicalApproach(userId: string, approach: ClinicalApproach) {
  const db = await localDbPromise;
  if (approach.userId !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  if (await db.get('approaches', approach.id)) throw new Error('Ya existe un abordaje con ese identificador.');
  const record = toRecord(userId, approach);
  await db.add('approaches', record);
  return toEntity(record, await getCategory(userId, record.category_id));
}

export async function updateClinicalApproach(userId: string, approach: ClinicalApproach) {
  const db = await localDbPromise;
  const existing: unknown = await db.get('approaches', approach.id);
  if (!existing) throw new Error('El abordaje ya no existe.');
  assertRecordV1(existing);
  if (existing.user_id !== userId || approach.userId !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  const record = toRecord(userId, approach, existing);
  await db.put('approaches', record);
  return toEntity(record, await getCategory(userId, record.category_id));
}

export async function saveClinicalApproach(userId: string, approach: ClinicalApproach) {
  const db = await localDbPromise;
  const existing: unknown = await db.get('approaches', approach.id);
  if (!existing) return createClinicalApproach(userId, approach);
  assertRecordV1(existing);
  return updateClinicalApproach(userId, approach);
}

export async function deleteClinicalApproachLocal(userId: string, id: string) {
  const db = await localDbPromise;
  const existing: unknown = await db.get('approaches', id);
  if (!existing) return;
  assertRecordV1(existing);
  if (existing.user_id !== userId) throw new Error('El abordaje no pertenece al usuario activo.');
  await db.delete('approaches', id);
}
