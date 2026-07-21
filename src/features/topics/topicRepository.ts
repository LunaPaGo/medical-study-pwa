import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Json } from '../../types/database';
import type {
  Category,
  Folder,
  OrganizationKind,
  SyncAction,
  SyncEntity,
  SyncQueueItem,
  Tag,
  Topic,
  TopicFormValues,
  TopicRelation,
  TopicRelationType,
  TopicTag,
  TopicWithRelations
} from '../../types/topic';
import { getDocumentForTopic, getTopicDocument } from './tiptapDocument';
import { cleanupOrphanedAttachmentSyncItems, flushAttachmentQueueItem } from '../attachments/attachmentRepository';
import { flushMedicationQueueItem } from '../medications/medicationRepository';
import { flushProcedureQueueItem } from '../procedures/procedureRepository';
import { topicSections } from './topicSectionCatalog';

type OrganizationRecord = Folder | Category | Tag;
type TopicPayload = { topic: Topic; tagIds: string[] };
type QueuedPayload = TopicPayload | OrganizationRecord | { id: string; user_id: string };

type SupabaseTopicPayload = Omit<
  Topic,
  | 'content_json'
  | 'definition_epidemiology_json'
  | 'clinical_json'
  | 'diagnosis_criteria_json'
  | 'treatment_management_json'
  | 'differential_diagnosis_json'
> & {
  content_json: Json;
  definition_epidemiology_json: Json;
  clinical_json: Json;
  diagnosis_criteria_json: Json;
  treatment_management_json: Json;
  differential_diagnosis_json: Json;
};

const organizationTables = {
  folders: 'folders',
  categories: 'categories',
  tags: 'tags'
} as const;

const organizationEntities = {
  folders: 'folder',
  categories: 'category',
  tags: 'tag'
} as const;

const entityTables = {
  folder: 'folders',
  category: 'categories',
  tag: 'tags'
} as const;

function nowIso() {
  return new Date().toISOString();
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : null;
}

function generateId() {
  return crypto.randomUUID();
}

function emitSyncQueueChanged() {
  window.dispatchEvent(new Event('sync-queue-changed'));
}

function logSyncStep(message: string, details?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[sync_queue] ${message}`, details ?? {});
  }
}

function normalizeSyncError(error: unknown) {
  if (error && typeof error === 'object') {
    const item = error as { message?: unknown; code?: unknown; status?: unknown; details?: unknown; hint?: unknown };
    return {
      message: typeof item.message === 'string' ? item.message : 'Error de sincronización.',
      code: typeof item.code === 'string' ? item.code : undefined,
      status: typeof item.status === 'number' || typeof item.status === 'string' ? item.status : undefined,
      details: typeof item.details === 'string' ? item.details : undefined,
      hint: typeof item.hint === 'string' ? item.hint : undefined
    };
  }
  return { message: error instanceof Error ? error.message : 'Error de sincronización.' };
}

function serializeSyncError(errorInfo: ReturnType<typeof normalizeSyncError>) {
  return JSON.stringify({
    code: errorInfo.code ?? null,
    message: errorInfo.message,
    details: errorInfo.details ?? null,
    hint: errorInfo.hint ?? null,
    status: errorInfo.status ?? null
  });
}

function nextRetryAfter(attemptCount: number) {
  const delayMs = Math.min(5 * 60 * 1000, 5000 * 2 ** Math.min(attemptCount, 5));
  return new Date(Date.now() + delayMs).toISOString();
}

function isSyncItemDue(item: SyncQueueItem, forceRetry = false) {
  return forceRetry || !item.retry_after || Date.parse(item.retry_after) <= Date.now();
}

function topicForSupabase(topic: Topic): SupabaseTopicPayload {
  return {
    ...topic,
    content_json: topic.content_json as Json,
    definition_epidemiology_json: topic.definition_epidemiology_json as Json,
    clinical_json: topic.clinical_json as Json,
    diagnosis_criteria_json: topic.diagnosis_criteria_json as Json,
    treatment_management_json: topic.treatment_management_json as Json,
    differential_diagnosis_json: topic.differential_diagnosis_json as Json
  };
}

function normalizeTopic(topic: Topic): { topic: Topic; wasConvertedFromHtml: boolean } {
  const { document, wasConvertedFromHtml } = getDocumentForTopic(topic.content_json, topic.content_html);

  return {
    topic: {
      ...topic,
      content_json: document,
      ...topicSections.reduce(
        (sections, section) => ({
          ...sections,
          [section.jsonField]: getTopicDocument(topic[section.jsonField]),
          [section.htmlField]: topic[section.htmlField] || '<p></p>'
        }),
        {}
      )
    },
    wasConvertedFromHtml
  };
}

async function enqueue(userId: string, entity: SyncEntity, action: SyncAction, payload: QueuedPayload) {
  const db = await localDbPromise;
  await db.put('sync_queue', {
    id: generateId(),
    user_id: userId,
    entity,
    action,
    payload,
    created_at: nowIso()
  });
  emitSyncQueueChanged();
}

async function getByUser<T extends { user_id: string }>(
  storeName: 'topics' | 'folders' | 'categories' | 'tags' | 'topic_tags' | 'topic_relations',
  userId: string
): Promise<T[]> {
  const db = await localDbPromise;
  return (await db.getAllFromIndex(storeName, 'user_id', userId)) as unknown as T[];
}

async function replaceTopicTags(topicId: string, userId: string, tagIds: string[]) {
  const db = await localDbPromise;
  const existing = await db.getAllFromIndex('topic_tags', 'topic_id', topicId);
  const tx = db.transaction('topic_tags', 'readwrite');
  await Promise.all(existing.map((item) => tx.store.delete([item.topic_id, item.tag_id] as [string, string])));
  await Promise.all(
    tagIds.map((tagId) =>
      tx.store.put({
        topic_id: topicId,
        tag_id: tagId,
        user_id: userId,
        created_at: nowIso()
      })
    )
  );
  await tx.done;
}

async function cacheRemoteData(userId: string) {
  const [topicsResult, foldersResult, categoriesResult, tagsResult, topicTagsResult, topicRelationsResult] = await Promise.all([
    supabase.from('topics').select('*').eq('user_id', userId),
    supabase.from('folders').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('topic_tags').select('*').eq('user_id', userId),
    supabase.from('topic_relations').select('*').eq('user_id', userId)
  ]);

  const firstError =
    topicsResult.error ??
    foldersResult.error ??
    categoriesResult.error ??
    tagsResult.error ??
    topicTagsResult.error ??
    topicRelationsResult.error;

  if (firstError) {
    throw firstError;
  }

  const db = await localDbPromise;
  const tx = db.transaction(['topics', 'folders', 'categories', 'tags', 'topic_tags', 'topic_relations'], 'readwrite');

  const normalizedTopics = (topicsResult.data ?? []).map((item) => normalizeTopic(item as Topic));
  await Promise.all(normalizedTopics.map((item) => tx.objectStore('topics').put(item.topic)));
  await Promise.all((foldersResult.data ?? []).map((item) => tx.objectStore('folders').put(item as Folder)));
  await Promise.all((categoriesResult.data ?? []).map((item) => tx.objectStore('categories').put(item as Category)));
  await Promise.all((tagsResult.data ?? []).map((item) => tx.objectStore('tags').put(item as Tag)));
  await Promise.all((topicTagsResult.data ?? []).map((item) => tx.objectStore('topic_tags').put(item as TopicTag)));
  await Promise.all((topicRelationsResult.data ?? []).map((item) => tx.objectStore('topic_relations').put(item as TopicRelation)));

  await tx.done;

  if (navigator.onLine) {
    await Promise.all(
      normalizedTopics
        .filter((item) => item.wasConvertedFromHtml)
        .map((item) => supabase.from('topics').update({ content_json: item.topic.content_json as Json }).eq('id', item.topic.id).eq('user_id', userId))
    );
  }
}

export async function loadTopicData(userId: string, shouldSyncRemote = navigator.onLine) {
  if (shouldSyncRemote) {
    try {
      await cacheRemoteData(userId);
    } catch {
      // Local cache remains the source when the network or Supabase is unavailable.
    }
  }

  const [topics, folders, categories, tags, topicTags, topicRelations] = await Promise.all([
    getByUser<Topic>('topics', userId),
    getByUser<Folder>('folders', userId),
    getByUser<Category>('categories', userId),
    getByUser<Tag>('tags', userId),
    getByUser<TopicTag>('topic_tags', userId),
    getByUser<TopicRelation>('topic_relations', userId)
  ]);

  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const topicTagsByTopic = topicTags.reduce<Map<string, Tag[]>>((map, item) => {
    const tag = tagsById.get(item.tag_id);
    if (tag) {
      map.set(item.topic_id, [...(map.get(item.topic_id) ?? []), tag]);
    }
    return map;
  }, new Map());
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const relationsByTopic = topicRelations.reduce<Map<string, TopicWithRelations['relatedTopics']>>((map, relation) => {
    const source = topicsById.get(relation.source_topic_id);
    const target = topicsById.get(relation.target_topic_id);
    if (!source || !target) return map;
    map.set(relation.source_topic_id, [
      ...(map.get(relation.source_topic_id) ?? []),
      { ...relation, relatedTopic: target, direction: 'direct' }
    ]);
    map.set(relation.target_topic_id, [
      ...(map.get(relation.target_topic_id) ?? []),
      { ...relation, relatedTopic: source, direction: 'inverse' }
    ]);
    return map;
  }, new Map());

  const db = await localDbPromise;
  const topicsWithRelations: TopicWithRelations[] = await Promise.all(
    topics.map(async (topic) => {
      const normalized = normalizeTopic(topic);
      if (normalized.wasConvertedFromHtml) {
        await db.put('topics', normalized.topic);
        if (navigator.onLine) {
          try {
            await supabase
              .from('topics')
              .update({ content_json: normalized.topic.content_json as Json })
              .eq('id', normalized.topic.id)
              .eq('user_id', userId);
          } catch {
            await enqueue(userId, 'topic', 'upsert', { topic: normalized.topic, tagIds: topicTags.filter((item) => item.topic_id === topic.id).map((item) => item.tag_id) });
          }
        } else {
          await enqueue(userId, 'topic', 'upsert', { topic: normalized.topic, tagIds: topicTags.filter((item) => item.topic_id === topic.id).map((item) => item.tag_id) });
        }
      }

      return {
        ...normalized.topic,
        folder: topic.folder_id ? foldersById.get(topic.folder_id) ?? null : null,
        category: topic.category_id ? categoriesById.get(topic.category_id) ?? null : null,
        tags: topicTagsByTopic.get(topic.id) ?? [],
        relatedTopics: relationsByTopic.get(topic.id) ?? []
      };
    })
  );

  return {
    topics: topicsWithRelations,
    folders,
    categories,
    tags
  };
}

export async function getTopicById(userId: string, topicId: string) {
  const data = await loadTopicData(userId, navigator.onLine);
  return data.topics.find((topic) => topic.id === topicId) ?? null;
}

async function pushTopicToSupabase(payload: TopicPayload) {
  const { topic, tagIds } = payload;
  const { error: topicError } = await supabase.from('topics').upsert(topicForSupabase(topic));
  if (topicError) throw topicError;

  const { error: deleteError } = await supabase.from('topic_tags').delete().eq('topic_id', topic.id).eq('user_id', topic.user_id);
  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ topic_id: topic.id, tag_id: tagId, user_id: topic.user_id }));
    const { error: tagError } = await supabase.from('topic_tags').insert(rows);
    if (tagError) throw tagError;
  }
}

export async function saveTopic(userId: string, values: TopicFormValues, existing?: Topic) {
  const timestamp = nowIso();
  const topic: Topic = {
    id: existing?.id ?? values.id ?? generateId(),
    user_id: userId,
    title: values.title.trim(),
    subtitle: normalizeOptional(values.subtitle),
    content_json: getTopicDocument(values.content_json),
    content_html: values.content_html,
    definition_epidemiology_json: getTopicDocument(values.definition_epidemiology_json),
    definition_epidemiology_html: values.definition_epidemiology_html,
    clinical_json: getTopicDocument(values.clinical_json),
    clinical_html: values.clinical_html,
    diagnosis_criteria_json: getTopicDocument(values.diagnosis_criteria_json),
    diagnosis_criteria_html: values.diagnosis_criteria_html,
    treatment_management_json: getTopicDocument(values.treatment_management_json),
    treatment_management_html: values.treatment_management_html,
    differential_diagnosis_json: getTopicDocument(values.differential_diagnosis_json),
    differential_diagnosis_html: values.differential_diagnosis_html,
    folder_id: values.folder_id || null,
    category_id: values.category_id || null,
    specialty: normalizeOptional(values.specialty),
    status: values.status,
    is_favorite: values.is_favorite,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp
  };

  const db = await localDbPromise;
  await db.put('topics', topic);
  await replaceTopicTags(topic.id, userId, values.tag_ids);

  const payload = { topic, tagIds: values.tag_ids };
  if (navigator.onLine) {
    try {
      await pushTopicToSupabase(payload);
    } catch {
      await enqueue(userId, 'topic', 'upsert', payload);
    }
  } else {
    await enqueue(userId, 'topic', 'upsert', payload);
  }

  return topic;
}

export async function duplicateTopic(userId: string, topic: TopicWithRelations) {
  return saveTopic(userId, {
    title: `${topic.title} (copia)`,
    subtitle: topic.subtitle ?? '',
    content_json: getTopicDocument(topic.content_json),
    content_html: topic.content_html,
    definition_epidemiology_json: getTopicDocument(topic.definition_epidemiology_json),
    definition_epidemiology_html: topic.definition_epidemiology_html,
    clinical_json: getTopicDocument(topic.clinical_json),
    clinical_html: topic.clinical_html,
    diagnosis_criteria_json: getTopicDocument(topic.diagnosis_criteria_json),
    diagnosis_criteria_html: topic.diagnosis_criteria_html,
    treatment_management_json: getTopicDocument(topic.treatment_management_json),
    treatment_management_html: topic.treatment_management_html,
    differential_diagnosis_json: getTopicDocument(topic.differential_diagnosis_json),
    differential_diagnosis_html: topic.differential_diagnosis_html,
    folder_id: topic.folder_id ?? '',
    category_id: topic.category_id ?? '',
    tag_ids: topic.tags.map((tag) => tag.id),
    specialty: topic.specialty ?? '',
    status: topic.status,
    is_favorite: false
  });
}

export async function deleteTopic(userId: string, topicId: string) {
  const db = await localDbPromise;
  const topicTags = await db.getAllFromIndex('topic_tags', 'topic_id', topicId);
  const sourceRelations = await db.getAllFromIndex('topic_relations', 'source_topic_id', topicId);
  const targetRelations = await db.getAllFromIndex('topic_relations', 'target_topic_id', topicId);
  const tx = db.transaction(['topics', 'topic_tags', 'topic_relations'], 'readwrite');
  await tx.objectStore('topics').delete(topicId);
  await Promise.all(topicTags.map((item) => tx.objectStore('topic_tags').delete([item.topic_id, item.tag_id] as [string, string])));
  await Promise.all([...sourceRelations, ...targetRelations].filter((item) => item.user_id === userId).map((item) => tx.objectStore('topic_relations').delete(item.id)));
  await tx.done;

  const payload = { id: topicId, user_id: userId };
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from('topics').delete().eq('id', topicId).eq('user_id', userId);
      if (error) throw error;
    } catch {
      await enqueue(userId, 'topic', 'delete', payload);
    }
  } else {
    await enqueue(userId, 'topic', 'delete', payload);
  }
}

export async function createTopicRelation(userId: string, sourceTopicId: string, targetTopicId: string, relationType: TopicRelationType) {
  if (sourceTopicId === targetTopicId) throw new Error('No se puede relacionar un tema consigo mismo.');
  if (!navigator.onLine) throw new Error('Necesitás conexión para crear relaciones entre temas.');

  const existing = await getByUser<TopicRelation>('topic_relations', userId);
  const duplicate = existing.some((relation) => {
    const exact =
      relation.source_topic_id === sourceTopicId &&
      relation.target_topic_id === targetTopicId &&
      relation.relation_type === relationType;
    const symmetricRelated =
      relationType === 'related' &&
      relation.relation_type === 'related' &&
      relation.source_topic_id === targetTopicId &&
      relation.target_topic_id === sourceTopicId;
    return exact || symmetricRelated;
  });
  if (duplicate) throw new Error('Esa relación ya existe.');

  const timestamp = nowIso();
  const relation: TopicRelation = {
    id: generateId(),
    user_id: userId,
    source_topic_id: sourceTopicId,
    target_topic_id: targetTopicId,
    relation_type: relationType,
    created_at: timestamp,
    updated_at: timestamp
  };

  const { error } = await supabase.from('topic_relations').insert(relation);
  if (error) throw error;
  const db = await localDbPromise;
  await db.put('topic_relations', relation);
  return relation;
}

export async function deleteTopicRelation(userId: string, relationId: string) {
  if (!navigator.onLine) throw new Error('Necesitás conexión para eliminar relaciones entre temas.');
  const { error } = await supabase.from('topic_relations').delete().eq('id', relationId).eq('user_id', userId);
  if (error) throw error;
  const db = await localDbPromise;
  await db.delete('topic_relations', relationId);
}

export async function toggleFavorite(userId: string, topic: TopicWithRelations) {
  return saveTopic(userId, {
    title: topic.title,
    subtitle: topic.subtitle ?? '',
    content_json: getTopicDocument(topic.content_json),
    content_html: topic.content_html,
    definition_epidemiology_json: getTopicDocument(topic.definition_epidemiology_json),
    definition_epidemiology_html: topic.definition_epidemiology_html,
    clinical_json: getTopicDocument(topic.clinical_json),
    clinical_html: topic.clinical_html,
    diagnosis_criteria_json: getTopicDocument(topic.diagnosis_criteria_json),
    diagnosis_criteria_html: topic.diagnosis_criteria_html,
    treatment_management_json: getTopicDocument(topic.treatment_management_json),
    treatment_management_html: topic.treatment_management_html,
    differential_diagnosis_json: getTopicDocument(topic.differential_diagnosis_json),
    differential_diagnosis_html: topic.differential_diagnosis_html,
    folder_id: topic.folder_id ?? '',
    category_id: topic.category_id ?? '',
    tag_ids: topic.tags.map((tag) => tag.id),
    specialty: topic.specialty ?? '',
    status: topic.status,
    is_favorite: !topic.is_favorite
  }, topic);
}

export async function saveOrganizationItem(
  userId: string,
  kind: OrganizationKind,
  values: { name: string; color?: string },
  existing?: OrganizationRecord
) {
  const timestamp = nowIso();
  const item: OrganizationRecord = {
    id: existing?.id ?? generateId(),
    user_id: userId,
    name: values.name.trim(),
    color: values.color?.trim() || null,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp
  };

  const db = await localDbPromise;
  await db.put(kind, item);

  const entity = organizationEntities[kind];
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from(organizationTables[kind]).upsert(item);
      if (error) throw error;
    } catch {
      await enqueue(userId, entity, 'upsert', item);
    }
  } else {
    await enqueue(userId, entity, 'upsert', item);
  }

  return item;
}

export async function deleteOrganizationItem(userId: string, kind: OrganizationKind, id: string) {
  const db = await localDbPromise;
  await db.delete(kind, id);

  const entity = organizationEntities[kind];
  const payload = { id, user_id: userId };
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from(organizationTables[kind]).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } catch {
      await enqueue(userId, entity, 'delete', payload);
    }
  } else {
    await enqueue(userId, entity, 'delete', payload);
  }
}

export async function getPendingSyncCount(userId: string) {
  const db = await localDbPromise;
  await cleanupOrphanedAttachmentSyncItems(userId);
  return (await db.getAllFromIndex('sync_queue', 'user_id', userId)).length;
}

export async function getNextSyncRetryAt(userId: string) {
  const db = await localDbPromise;
  const items = await db.getAllFromIndex('sync_queue', 'user_id', userId);
  return items
    .map((item) => item.retry_after)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b))[0] ?? null;
}

export type FlushSyncQueueResult = {
  flushed: number;
  attempted: number;
  failed: number;
  nextRetryAt: string | null;
};

export async function flushSyncQueue(userId: string, options: { forceRetry?: boolean } = {}) {
  if (!navigator.onLine) return { flushed: 0, attempted: 0, failed: 0, nextRetryAt: null };

  const db = await localDbPromise;
  const allItems = (await db.getAllFromIndex('sync_queue', 'user_id', userId)).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  const items = allItems.filter((item) => isSyncItemDue(item, options.forceRetry));
  let flushed = 0;
  let attempted = 0;
  let failed = 0;

  logSyncStep('flush_start', { pending: allItems.length, due: items.length, forceRetry: Boolean(options.forceRetry) });

  for (const item of items) {
    attempted += 1;
    try {
      logSyncStep('remote_attempt_start', { id: item.id, entity: item.entity, action: item.action });
      if (item.entity === 'topic') {
        if (item.action === 'delete') {
          const payload = item.payload as { id: string; user_id: string };
          const { error } = await supabase.from('topics').delete().eq('id', payload.id).eq('user_id', userId);
          if (error) throw error;
        } else {
          await pushTopicToSupabase(item.payload as TopicPayload);
        }
      } else if (item.entity === 'attachment') {
        await flushAttachmentQueueItem(item);
      } else if (item.entity === 'medication') {
        await flushMedicationQueueItem(item);
      } else if (item.entity === 'procedure') {
        await flushProcedureQueueItem(item);
      } else {
        const table = entityTables[item.entity];
        if (item.action === 'delete') {
          const payload = item.payload as { id: string; user_id: string };
          const { error } = await supabase.from(table).delete().eq('id', payload.id).eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table).upsert(item.payload as OrganizationRecord);
          if (error) throw error;
        }
      }

      await db.delete('sync_queue', item.id);
      flushed += 1;
      logSyncStep('remote_attempt_success', { id: item.id, entity: item.entity, action: item.action });
    } catch (error) {
      failed += 1;
      const errorInfo = normalizeSyncError(error);
      const attemptCount = (item.attempt_count ?? 0) + 1;
      const retryAfter = nextRetryAfter(attemptCount);
      const failedItem: SyncQueueItem = {
        ...item,
        attempt_count: attemptCount,
        last_attempt_at: nowIso(),
        last_error: serializeSyncError(errorInfo),
        retry_after: retryAfter
      };
      await db.put('sync_queue', failedItem);
      logSyncStep('remote_attempt_error', {
        id: item.id,
        entity: item.entity,
        action: item.action,
        attemptCount,
        retryAfter,
        error: errorInfo
      });
    }
  }

  const remaining = await db.getAllFromIndex('sync_queue', 'user_id', userId);
  const nextRetryAt =
    remaining
      .map((item) => item.retry_after)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b))[0] ?? null;

  logSyncStep('flush_complete', { flushed, attempted, failed, remaining: remaining.length, nextRetryAt });
  emitSyncQueueChanged();
  return { flushed, attempted, failed, nextRetryAt };
}
