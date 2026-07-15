import { openDB } from 'idb';
import type { Attachment, AttachmentLink, PendingAttachmentFile, TopicAttachment } from '../types/attachment';
import type { Category, Folder, SyncQueueItem, Tag, Topic, TopicTag } from '../types/topic';

type MedicalStudyDb = {
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { created_at: string; user_id: string };
  };
  app_cache: {
    key: string;
    value: { key: string; value: unknown; updated_at: string };
  };
  topics: {
    key: string;
    value: Topic;
    indexes: { user_id: string; updated_at: string; title: string };
  };
  folders: {
    key: string;
    value: Folder;
    indexes: { user_id: string; name: string };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { user_id: string; name: string };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: { user_id: string; name: string };
  };
  topic_tags: {
    key: [string, string];
    value: TopicTag;
    indexes: { topic_id: string; tag_id: string; user_id: string };
  };
  attachments: {
    key: string;
    value: Attachment;
    indexes: { user_id: string; created_at: string; filename: string; sync_status: string };
  };
  attachment_links: {
    key: string;
    value: AttachmentLink;
    indexes: { user_id: string; attachment_id: string; owner: [string, string] };
  };
  pending_attachment_files: {
    key: string;
    value: PendingAttachmentFile;
    indexes: { user_id: string; created_at: string };
  };
  topic_attachments: {
    key: string;
    value: TopicAttachment;
    indexes: { user_id: string; topic_id: string; attachment_id: string };
  };
};

export const localDbPromise = openDB<MedicalStudyDb>('medical-study-local-db', 5, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sync_queue')) {
      const queue = db.createObjectStore('sync_queue', { keyPath: 'id' });
      queue.createIndex('created_at', 'created_at');
      queue.createIndex('user_id', 'user_id');
    }

    if (!db.objectStoreNames.contains('app_cache')) {
      db.createObjectStore('app_cache', { keyPath: 'key' });
    }

    if (!db.objectStoreNames.contains('topics')) {
      const topics = db.createObjectStore('topics', { keyPath: 'id' });
      topics.createIndex('user_id', 'user_id');
      topics.createIndex('updated_at', 'updated_at');
      topics.createIndex('title', 'title');
    }

    if (!db.objectStoreNames.contains('folders')) {
      const folders = db.createObjectStore('folders', { keyPath: 'id' });
      folders.createIndex('user_id', 'user_id');
      folders.createIndex('name', 'name');
    }

    if (!db.objectStoreNames.contains('categories')) {
      const categories = db.createObjectStore('categories', { keyPath: 'id' });
      categories.createIndex('user_id', 'user_id');
      categories.createIndex('name', 'name');
    }

    if (!db.objectStoreNames.contains('tags')) {
      const tags = db.createObjectStore('tags', { keyPath: 'id' });
      tags.createIndex('user_id', 'user_id');
      tags.createIndex('name', 'name');
    }

    if (!db.objectStoreNames.contains('topic_tags')) {
      const topicTags = db.createObjectStore('topic_tags', { keyPath: ['topic_id', 'tag_id'] });
      topicTags.createIndex('topic_id', 'topic_id');
      topicTags.createIndex('tag_id', 'tag_id');
      topicTags.createIndex('user_id', 'user_id');
    }

    if (!db.objectStoreNames.contains('attachments')) {
      const attachments = db.createObjectStore('attachments', { keyPath: 'id' });
      attachments.createIndex('user_id', 'user_id');
      attachments.createIndex('created_at', 'created_at');
      attachments.createIndex('filename', 'filename');
      attachments.createIndex('sync_status', 'sync_status');
    }

    if (!db.objectStoreNames.contains('attachment_links')) {
      const links = db.createObjectStore('attachment_links', { keyPath: 'id' });
      links.createIndex('user_id', 'user_id');
      links.createIndex('attachment_id', 'attachment_id');
      links.createIndex('owner', ['owner_type', 'owner_id']);
    }

    if (!db.objectStoreNames.contains('pending_attachment_files')) {
      const files = db.createObjectStore('pending_attachment_files', { keyPath: 'attachment_id' });
      files.createIndex('user_id', 'user_id');
      files.createIndex('created_at', 'created_at');
    }

    if (!db.objectStoreNames.contains('topic_attachments')) {
      const topicAttachments = db.createObjectStore('topic_attachments', { keyPath: 'id' });
      topicAttachments.createIndex('user_id', 'user_id');
      topicAttachments.createIndex('topic_id', 'topic_id');
      topicAttachments.createIndex('attachment_id', 'attachment_id');
    }
  }
});
