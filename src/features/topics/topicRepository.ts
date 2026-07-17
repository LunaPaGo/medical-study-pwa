import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Json } from '../../types/database';
import type {
  Category,
  Folder,
  OrganizationKind,
  SyncAction,
  SyncEntity,
  Tag,
  Topic,
  TopicFormValues,
  TopicTag,
  TopicWithRelations
} from '../../types/topic';
import { getDocumentForTopic, getTopicDocument } from './tiptapDocument';
import { cleanupOrphanedAttachmentSyncItems, flushAttachmentQueueItem } from '../attachments/attachmentRepository';
import { flushMedicationQueueItem } from '../medications/medicationRepository';

type OrganizationRecord = Folder | Category | Tag;
type TopicPayload = { topic: Topic; tagIds: string[] };
type QueuedPayload = TopicPayload | OrganizationRecord | { id: string; user_id: string };

type SupabaseTopicPayload = Omit<Topic, 'content_json'> & { content_json: Json };

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

function topicForSupabase(topic: Topic): SupabaseTopicPayload {
  return {
    ...topic,
    content_json: topic.content_json as Json
  };
}

function normalizeTopic(topic: Topic): { topic: Topic; wasConvertedFromHtml: boolean } {
  const { document, wasConvertedFromHtml } = getDocumentForTopic(topic.content_json, topic.content_html);

  return {
    topic: {
      ...topic,
      content_json: document
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
  storeName: 'topics' | 'folders' | 'categories' | 'tags' | 'topic_tags',
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
  const [topicsResult, foldersResult, categoriesResult, tagsResult, topicTagsResult] = await Promise.all([
    supabase.from('topics').select('*').eq('user_id', userId),
    supabase.from('folders').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('topic_tags').select('*').eq('user_id', userId)
  ]);

  const firstError =
    topicsResult.error ??
    foldersResult.error ??
    categoriesResult.error ??
    tagsResult.error ??
    topicTagsResult.error;

  if (firstError) {
    throw firstError;
  }

  const db = await localDbPromise;
  const tx = db.transaction(['topics', 'folders', 'categories', 'tags', 'topic_tags'], 'readwrite');

  const normalizedTopics = (topicsResult.data ?? []).map((item) => normalizeTopic(item as Topic));
  await Promise.all(normalizedTopics.map((item) => tx.objectStore('topics').put(item.topic)));
  await Promise.all((foldersResult.data ?? []).map((item) => tx.objectStore('folders').put(item as Folder)));
  await Promise.all((categoriesResult.data ?? []).map((item) => tx.objectStore('categories').put(item as Category)));
  await Promise.all((tagsResult.data ?? []).map((item) => tx.objectStore('tags').put(item as Tag)));
  await Promise.all((topicTagsResult.data ?? []).map((item) => tx.objectStore('topic_tags').put(item as TopicTag)));

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

  const [topics, folders, categories, tags, topicTags] = await Promise.all([
    getByUser<Topic>('topics', userId),
    getByUser<Folder>('folders', userId),
    getByUser<Category>('categories', userId),
    getByUser<Tag>('tags', userId),
    getByUser<TopicTag>('topic_tags', userId)
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
        tags: topicTagsByTopic.get(topic.id) ?? []
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
  const tx = db.transaction(['topics', 'topic_tags'], 'readwrite');
  await tx.objectStore('topics').delete(topicId);
  await Promise.all(topicTags.map((item) => tx.objectStore('topic_tags').delete([item.topic_id, item.tag_id] as [string, string])));
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

export async function toggleFavorite(userId: string, topic: TopicWithRelations) {
  return saveTopic(userId, {
    title: topic.title,
    subtitle: topic.subtitle ?? '',
    content_json: getTopicDocument(topic.content_json),
    content_html: topic.content_html,
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

export async function flushSyncQueue(userId: string) {
  if (!navigator.onLine) return 0;

  const db = await localDbPromise;
  const items = (await db.getAllFromIndex('sync_queue', 'user_id', userId)).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  let flushed = 0;

  for (const item of items) {
    try {
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
    } catch {
      break;
    }
  }

  emitSyncQueueChanged();
  return flushed;
}
