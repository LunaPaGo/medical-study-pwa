import { supabase } from '../../services/supabase';
import { localDbPromise } from '../../storage/localDb';
import type { Attachment } from '../../types/attachment';
import type { Json } from '../../types/database';
import type {
  Medication,
  MedicationAttachment,
  MedicationFilterOptions,
  MedicationFormValues,
  MedicationRichField,
  MedicationTag,
  MedicationWithRelations
} from '../../types/medication';
import type { SyncAction, Tag, TipTapDocument } from '../../types/topic';
import { emptyTipTapDocument, getTopicDocument } from '../topics/tiptapDocument';
import { emptyRichFields, medicationRichFields, tiptapToText } from './medicationFields';
import { medicationStudySections } from './medicationStudySectionCatalog';

type MedicationPayload = { medication: Medication; tagIds: string[] };
type QueuedMedicationPayload = MedicationPayload | { id: string; user_id: string };
type MedicationStudyJsonField = (typeof medicationStudySections)[number]['jsonField'];
type SupabaseMedicationPayload = Omit<Medication, MedicationRichField | MedicationStudyJsonField> &
  Record<MedicationRichField | MedicationStudyJsonField, Json>;

function medicationStudyValues(source: Pick<Medication, MedicationStudyJsonField | (typeof medicationStudySections)[number]['htmlField']>) {
  return medicationStudySections.reduce(
    (fields, section) => ({
      ...fields,
      [section.jsonField]: getTopicDocument(source[section.jsonField]),
      [section.htmlField]: source[section.htmlField] || '<p></p>'
    }),
    {} as Pick<Medication, MedicationStudyJsonField | (typeof medicationStudySections)[number]['htmlField']>
  );
}

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return crypto.randomUUID();
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : null;
}

function emitSyncQueueChanged() {
  window.dispatchEvent(new Event('sync-queue-changed'));
}

function medicationForSupabase(medication: Medication): SupabaseMedicationPayload {
  const payload = medicationRichFields.reduce(
    (payload, key) => ({
      ...payload,
      [key]: medication[key] as Json
    }),
    { ...medication } as unknown as SupabaseMedicationPayload
  );
  return medicationStudySections.reduce((next, section) => ({ ...next, [section.jsonField]: medication[section.jsonField] as Json }), payload);
}

function normalizeMedication(item: Medication): Medication {
  return medicationRichFields.reduce(
    (medication, key) => ({
      ...medication,
      [key]: getTopicDocument(item[key])
    }),
    {
      ...item,
      search_text: item.search_text ?? '',
      ...medicationStudyValues(item)
    } as Medication
  );
}

async function getByUser<T extends { user_id: string }>(
  storeName: 'medications' | 'medication_tags' | 'medication_attachments' | 'tags' | 'attachments',
  userId: string
): Promise<T[]> {
  const db = await localDbPromise;
  return (await db.getAllFromIndex(storeName, 'user_id', userId)) as unknown as T[];
}

async function enqueueMedication(userId: string, action: SyncAction, payload: QueuedMedicationPayload) {
  const db = await localDbPromise;
  await db.put('sync_queue', {
    id: generateId(),
    user_id: userId,
    entity: 'medication',
    action,
    payload,
    created_at: nowIso()
  });
  emitSyncQueueChanged();
}

async function replaceMedicationTags(medicationId: string, userId: string, tagIds: string[]) {
  const db = await localDbPromise;
  const existing = await db.getAllFromIndex('medication_tags', 'medication_id', medicationId);
  const tx = db.transaction('medication_tags', 'readwrite');
  await Promise.all(existing.map((item) => tx.store.delete([item.medication_id, item.tag_id] as [string, string])));
  await Promise.all(
    tagIds.map((tagId) =>
      tx.store.put({
        medication_id: medicationId,
        tag_id: tagId,
        user_id: userId,
        created_at: nowIso()
      })
    )
  );
  await tx.done;
}

function buildSearchText(values: {
  medication: Medication;
  tags: Tag[];
}) {
  const { medication, tags } = values;
  return [
    medication.generic_name,
    medication.pharmacologic_group,
    medication.pharmacologic_subgroup,
    medication.short_description,
    ...tags.map((tag) => tag.name),
    ...medicationRichFields.map((key) => tiptapToText(medication[key])),
    ...medicationStudySections.map((section) => tiptapToText(medication[section.jsonField]))
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function cacheRemoteMedicationData(userId: string) {
  const [medicationsResult, medicationTagsResult, tagsResult, medicationAttachmentsResult, attachmentsResult] = await Promise.all([
    supabase.from('medications').select('*').eq('user_id', userId),
    supabase.from('medication_tags').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('medication_attachments').select('*').eq('user_id', userId),
    supabase.from('attachments').select('*').eq('user_id', userId)
  ]);

  const firstError =
    medicationsResult.error ??
    medicationTagsResult.error ??
    tagsResult.error ??
    medicationAttachmentsResult.error ??
    attachmentsResult.error;

  if (firstError) throw firstError;

  const db = await localDbPromise;
  const tx = db.transaction(['medications', 'medication_tags', 'tags', 'medication_attachments', 'attachments'], 'readwrite');
  await Promise.all((medicationsResult.data ?? []).map((item) => tx.objectStore('medications').put(normalizeMedication(item as Medication))));
  await Promise.all((medicationTagsResult.data ?? []).map((item) => tx.objectStore('medication_tags').put(item as MedicationTag)));
  await Promise.all((tagsResult.data ?? []).map((item) => tx.objectStore('tags').put(item as Tag)));
  await Promise.all((medicationAttachmentsResult.data ?? []).map((item) => tx.objectStore('medication_attachments').put(item as MedicationAttachment)));
  await Promise.all((attachmentsResult.data ?? []).map((item) => tx.objectStore('attachments').put({ ...item, sync_status: 'synced' })));
  await tx.done;
}

export async function loadMedicationData(userId: string, shouldSyncRemote = navigator.onLine) {
  if (shouldSyncRemote) {
    try {
      await cacheRemoteMedicationData(userId);
    } catch {
      // The local cache remains usable offline or when Supabase is unavailable.
    }
  }

  const [medications, medicationTags, tags, medicationAttachments, attachments] = await Promise.all([
    getByUser<Medication>('medications', userId),
    getByUser<MedicationTag>('medication_tags', userId),
    getByUser<Tag>('tags', userId),
    getByUser<MedicationAttachment>('medication_attachments', userId),
    getByUser<Attachment>('attachments', userId)
  ]);

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const attachmentsById = new Map(attachments.map((attachment) => [attachment.id, attachment]));

  const tagsByMedication = medicationTags.reduce<Map<string, Tag[]>>((map, item) => {
    const tag = tagsById.get(item.tag_id);
    if (tag) {
      map.set(item.medication_id, [...(map.get(item.medication_id) ?? []), tag]);
    }
    return map;
  }, new Map());

  const attachmentsByMedication = medicationAttachments.reduce<Map<string, Attachment[]>>((map, item) => {
    const attachment = attachmentsById.get(item.attachment_id);
    if (attachment) {
      map.set(item.medication_id, [...(map.get(item.medication_id) ?? []), attachment]);
    }
    return map;
  }, new Map());

  return {
    medications: medications.map((medication) => ({
      ...normalizeMedication(medication),
      tags: tagsByMedication.get(medication.id) ?? [],
      attachments: attachmentsByMedication.get(medication.id) ?? []
    })) as MedicationWithRelations[],
    tags
  };
}

export async function getMedicationById(userId: string, medicationId: string) {
  const data = await loadMedicationData(userId, navigator.onLine);
  return data.medications.find((medication) => medication.id === medicationId) ?? null;
}

async function pushMedicationToSupabase(payload: MedicationPayload) {
  const { medication, tagIds } = payload;
  const { error: medicationError } = await supabase.from('medications').upsert(medicationForSupabase(medication));
  if (medicationError) throw medicationError;

  const { error: deleteError } = await supabase
    .from('medication_tags')
    .delete()
    .eq('medication_id', medication.id)
    .eq('user_id', medication.user_id);
  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ medication_id: medication.id, tag_id: tagId, user_id: medication.user_id }));
    const { error: tagError } = await supabase.from('medication_tags').insert(rows);
    if (tagError) throw tagError;
  }
}

export async function saveMedication(userId: string, values: MedicationFormValues, existing?: MedicationWithRelations) {
  const timestamp = nowIso();
  const richFields = medicationRichFields.reduce(
    (fields, key) => ({
      ...fields,
      [key]: getTopicDocument(values[key] ?? existing?.[key] ?? emptyTipTapDocument)
    }),
    {} as Record<MedicationRichField, TipTapDocument>
  );

  const medication: Medication = {
    id: existing?.id ?? values.id ?? generateId(),
    user_id: userId,
    generic_name: normalizeOptional(values.generic_name),
    pharmacologic_group: normalizeOptional(values.pharmacologic_group),
    pharmacologic_subgroup: normalizeOptional(values.pharmacologic_subgroup),
    short_description: normalizeOptional(values.short_description),
    status: values.status,
    is_favorite: values.is_favorite,
    search_text: '',
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
    ...medicationStudyValues(values),
    ...richFields
  };

  const db = await localDbPromise;
  const tags = await getByUser<Tag>('tags', userId);
  const selectedTags = tags.filter((tag) => values.tag_ids.includes(tag.id));
  medication.search_text = buildSearchText({ medication, tags: selectedTags });

  await db.put('medications', medication);
  await replaceMedicationTags(medication.id, userId, values.tag_ids);

  const payload = { medication, tagIds: values.tag_ids };
  if (navigator.onLine) {
    try {
      await pushMedicationToSupabase(payload);
    } catch {
      await enqueueMedication(userId, 'upsert', payload);
    }
  } else {
    await enqueueMedication(userId, 'upsert', payload);
  }

  return medication;
}

export async function duplicateMedication(userId: string, medication: MedicationWithRelations) {
  return saveMedication(userId, {
    id: generateId(),
    generic_name: medication.generic_name ? `${medication.generic_name} (copia)` : 'Medicamento sin nombre (copia)',
    pharmacologic_group: medication.pharmacologic_group ?? '',
    pharmacologic_subgroup: medication.pharmacologic_subgroup ?? '',
    short_description: medication.short_description ?? '',
    status: medication.status,
    is_favorite: false,
    tag_ids: medication.tags.map((tag) => tag.id),
    ...medicationRichFields.reduce((fields, key) => ({ ...fields, [key]: medication[key] }), {} as Record<MedicationRichField, TipTapDocument>),
    ...medicationStudyValues(medication)
  });
}

export async function deleteMedication(userId: string, medicationId: string) {
  const db = await localDbPromise;
  const medicationTags = await db.getAllFromIndex('medication_tags', 'medication_id', medicationId);
  const medicationAttachments = await db.getAllFromIndex('medication_attachments', 'medication_id', medicationId);
  const tx = db.transaction(['medications', 'medication_tags', 'medication_attachments'], 'readwrite');
  await tx.objectStore('medications').delete(medicationId);
  await Promise.all(medicationTags.map((item) => tx.objectStore('medication_tags').delete([item.medication_id, item.tag_id] as [string, string])));
  await Promise.all(medicationAttachments.map((item) => tx.objectStore('medication_attachments').delete(item.id)));
  await tx.done;

  const payload = { id: medicationId, user_id: userId };
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', medicationId).eq('user_id', userId);
      if (error) throw error;
    } catch {
      await enqueueMedication(userId, 'delete', payload);
    }
  } else {
    await enqueueMedication(userId, 'delete', payload);
  }
}

export async function toggleMedicationFavorite(userId: string, medication: MedicationWithRelations) {
  return saveMedication(
    userId,
    {
      generic_name: medication.generic_name ?? '',
      pharmacologic_group: medication.pharmacologic_group ?? '',
      pharmacologic_subgroup: medication.pharmacologic_subgroup ?? '',
      short_description: medication.short_description ?? '',
      status: medication.status,
      is_favorite: !medication.is_favorite,
      tag_ids: medication.tags.map((tag) => tag.id),
      ...medicationRichFields.reduce((fields, key) => ({ ...fields, [key]: medication[key] }), {} as Record<MedicationRichField, TipTapDocument>),
      ...medicationStudyValues(medication)
    },
    medication
  );
}

export function filterMedications(medications: MedicationWithRelations[], options: MedicationFilterOptions) {
  const needle = options.search.trim().toLowerCase();
  const filtered = medications.filter((medication) => {
    const matchesSearch = !needle || medication.search_text.includes(needle);
    const matchesGroup = !options.group || medication.pharmacologic_group === options.group;
    const matchesTag = !options.tagId || medication.tags.some((tag) => tag.id === options.tagId);
    const matchesFavorite = !options.favoriteOnly || medication.is_favorite;
    const matchesStatus = !options.status || medication.status === options.status;
    const matchesAdministration =
      !options.administration || tiptapToText(medication.dosing_administration_json).toLowerCase().includes(options.administration.toLowerCase());

    return matchesSearch && matchesGroup && matchesTag && matchesFavorite && matchesStatus && matchesAdministration;
  });

  return filtered.sort((a, b) => {
    if (options.sort === 'generic_name_asc') {
      return (a.generic_name ?? '').localeCompare(b.generic_name ?? '', 'es');
    }
    if (options.sort === 'created_desc') {
      return b.created_at.localeCompare(a.created_at);
    }
    if (options.sort === 'favorite_desc') {
      return Number(b.is_favorite) - Number(a.is_favorite) || b.updated_at.localeCompare(a.updated_at);
    }
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export async function flushMedicationQueueItem(item: { action: SyncAction; payload: unknown; user_id: string }) {
  if (item.action === 'delete') {
    const payload = item.payload as { id: string; user_id: string };
    const { error } = await supabase.from('medications').delete().eq('id', payload.id).eq('user_id', item.user_id);
    if (error) throw error;
    return;
  }

  await pushMedicationToSupabase(item.payload as MedicationPayload);
}

export function createEmptyMedicationValues(id = generateId()): MedicationFormValues {
  return {
    id,
    generic_name: '',
    pharmacologic_group: '',
    pharmacologic_subgroup: '',
    short_description: '',
    status: 'draft',
    is_favorite: false,
    tag_ids: [],
    ...medicationStudySections.reduce(
      (fields, section) => ({ ...fields, [section.jsonField]: emptyTipTapDocument, [section.htmlField]: '<p></p>' }),
      {} as Pick<MedicationFormValues, MedicationStudyJsonField | (typeof medicationStudySections)[number]['htmlField']>
    ),
    ...emptyRichFields()
  };
}
