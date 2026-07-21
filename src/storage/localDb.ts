import { openDB } from 'idb';
import type { Attachment, AttachmentLink, MedicationAttachment, PendingAttachmentFile, ProcedureAttachment, TopicAttachment } from '../types/attachment';
import type { EditingSession } from '../types/editingSession';
import type { Medication, MedicationTag } from '../types/medication';
import type { Procedure, ProcedureTag } from '../types/procedure';
import type { Category, Folder, SyncQueueItem, Tag, Topic, TopicRelation, TopicTag } from '../types/topic';

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
  editing_sessions: {
    key: string;
    value: EditingSession;
    indexes: { user_id: string; updated_at: string; entity: [string, string, string] };
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
  topic_relations: {
    key: string;
    value: TopicRelation;
    indexes: { user_id: string; source_topic_id: string; target_topic_id: string; relation_type: string };
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
  medications: {
    key: string;
    value: Medication;
    indexes: { user_id: string; updated_at: string; generic_name: string; pharmacologic_group: string; status: string; is_favorite: string };
  };
  medication_tags: {
    key: [string, string];
    value: MedicationTag;
    indexes: { medication_id: string; tag_id: string; user_id: string };
  };
  medication_attachments: {
    key: string;
    value: MedicationAttachment;
    indexes: { user_id: string; medication_id: string; attachment_id: string };
  };
  procedures: {
    key: string;
    value: Procedure;
    indexes: { user_id: string; updated_at: string; name: string; category: string; status: string; is_favorite: string };
  };
  procedure_tags: {
    key: [string, string];
    value: ProcedureTag;
    indexes: { procedure_id: string; tag_id: string; user_id: string };
  };
  procedure_attachments: {
    key: string;
    value: ProcedureAttachment;
    indexes: { user_id: string; procedure_id: string; attachment_id: string };
  };
};

export const localDbPromise = openDB<MedicalStudyDb>('medical-study-local-db', 10, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sync_queue')) {
      const queue = db.createObjectStore('sync_queue', { keyPath: 'id' });
      queue.createIndex('created_at', 'created_at');
      queue.createIndex('user_id', 'user_id');
    }

    if (!db.objectStoreNames.contains('app_cache')) {
      db.createObjectStore('app_cache', { keyPath: 'key' });
    }

    if (!db.objectStoreNames.contains('editing_sessions')) {
      const sessions = db.createObjectStore('editing_sessions', { keyPath: 'key' });
      sessions.createIndex('user_id', 'user_id');
      sessions.createIndex('updated_at', 'updated_at');
      sessions.createIndex('entity', ['entity_type', 'entity_id', 'draft_id']);
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

    if (!db.objectStoreNames.contains('topic_relations')) {
      const topicRelations = db.createObjectStore('topic_relations', { keyPath: 'id' });
      topicRelations.createIndex('user_id', 'user_id');
      topicRelations.createIndex('source_topic_id', 'source_topic_id');
      topicRelations.createIndex('target_topic_id', 'target_topic_id');
      topicRelations.createIndex('relation_type', 'relation_type');
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

    if (!db.objectStoreNames.contains('medications')) {
      const medications = db.createObjectStore('medications', { keyPath: 'id' });
      medications.createIndex('user_id', 'user_id');
      medications.createIndex('updated_at', 'updated_at');
      medications.createIndex('generic_name', 'generic_name');
      medications.createIndex('pharmacologic_group', 'pharmacologic_group');
      medications.createIndex('status', 'status');
      medications.createIndex('is_favorite', 'is_favorite');
    }

    if (!db.objectStoreNames.contains('medication_tags')) {
      const medicationTags = db.createObjectStore('medication_tags', { keyPath: ['medication_id', 'tag_id'] });
      medicationTags.createIndex('medication_id', 'medication_id');
      medicationTags.createIndex('tag_id', 'tag_id');
      medicationTags.createIndex('user_id', 'user_id');
    }

    if (!db.objectStoreNames.contains('medication_attachments')) {
      const medicationAttachments = db.createObjectStore('medication_attachments', { keyPath: 'id' });
      medicationAttachments.createIndex('user_id', 'user_id');
      medicationAttachments.createIndex('medication_id', 'medication_id');
      medicationAttachments.createIndex('attachment_id', 'attachment_id');
    }

    if (!db.objectStoreNames.contains('procedures')) {
      const procedures = db.createObjectStore('procedures', { keyPath: 'id' });
      procedures.createIndex('user_id', 'user_id');
      procedures.createIndex('updated_at', 'updated_at');
      procedures.createIndex('name', 'name');
      procedures.createIndex('category', 'category');
      procedures.createIndex('status', 'status');
      procedures.createIndex('is_favorite', 'is_favorite');
    }

    if (!db.objectStoreNames.contains('procedure_tags')) {
      const procedureTags = db.createObjectStore('procedure_tags', { keyPath: ['procedure_id', 'tag_id'] });
      procedureTags.createIndex('procedure_id', 'procedure_id');
      procedureTags.createIndex('tag_id', 'tag_id');
      procedureTags.createIndex('user_id', 'user_id');
    }

    if (!db.objectStoreNames.contains('procedure_attachments')) {
      const procedureAttachments = db.createObjectStore('procedure_attachments', { keyPath: 'id' });
      procedureAttachments.createIndex('user_id', 'user_id');
      procedureAttachments.createIndex('procedure_id', 'procedure_id');
      procedureAttachments.createIndex('attachment_id', 'attachment_id');
    }
  }
});
