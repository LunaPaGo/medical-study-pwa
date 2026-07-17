import JSZip from 'jszip';
import { z } from 'zod';
import { backupFormat, backupVersion, type BackupManifest, type BackupValidationCheck, type BackupValidationResult } from './backupTypes';
import { topicRelationTypes } from '../topics/topicRelationCatalog';

const uuidSchema = z.string().uuid();
const isoDateSchema = z.string().min(1);
const nullableString = z.string().nullable();
const tiptapSchema: z.ZodType<unknown> = z.unknown();
const defaultTipTapDocument = { type: 'doc', content: [{ type: 'paragraph' }] };

const baseUserRecord = {
  id: uuidSchema,
  user_id: uuidSchema,
  created_at: isoDateSchema,
  updated_at: isoDateSchema
};

const profileSchema = z
  .object({
    user_id: uuidSchema,
    display_name: nullableString,
    created_at: isoDateSchema.optional(),
    updated_at: isoDateSchema.optional()
  })
  .nullable();

const organizationItemSchema = z.object({
  ...baseUserRecord,
  name: z.string(),
  color: nullableString
});

const topicSchema = z.object({
  ...baseUserRecord,
  title: z.string(),
  subtitle: nullableString,
  content_json: tiptapSchema,
  content_html: z.string(),
  definition_epidemiology_json: tiptapSchema.optional().default(defaultTipTapDocument),
  definition_epidemiology_html: z.string().optional().default('<p></p>'),
  clinical_json: tiptapSchema.optional().default(defaultTipTapDocument),
  clinical_html: z.string().optional().default('<p></p>'),
  diagnosis_criteria_json: tiptapSchema.optional().default(defaultTipTapDocument),
  diagnosis_criteria_html: z.string().optional().default('<p></p>'),
  treatment_management_json: tiptapSchema.optional().default(defaultTipTapDocument),
  treatment_management_html: z.string().optional().default('<p></p>'),
  differential_diagnosis_json: tiptapSchema.optional().default(defaultTipTapDocument),
  differential_diagnosis_html: z.string().optional().default('<p></p>'),
  folder_id: uuidSchema.nullable(),
  category_id: uuidSchema.nullable(),
  specialty: nullableString,
  status: z.enum(['draft', 'complete']),
  is_favorite: z.boolean()
});

const topicTagSchema = z.object({
  topic_id: uuidSchema,
  tag_id: uuidSchema,
  user_id: uuidSchema,
  created_at: isoDateSchema
});

const topicRelationSchema = z.object({
  ...baseUserRecord,
  source_topic_id: uuidSchema,
  target_topic_id: uuidSchema,
  relation_type: z.enum(topicRelationTypes)
});

const attachmentSchema = z.object({
  ...baseUserRecord,
  filename: z.string(),
  original_filename: z.string(),
  mime_type: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  storage_path: z.string(),
  thumbnail_path: z.string().nullable()
});

const attachmentLinkSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  attachment_id: uuidSchema,
  owner_type: z.string(),
  owner_id: uuidSchema,
  created_at: isoDateSchema
});

const topicAttachmentSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  topic_id: uuidSchema,
  attachment_id: uuidSchema,
  created_at: isoDateSchema
});

const medicationRichFields = {
  mechanism_of_action: tiptapSchema,
  therapeutic_targets: tiptapSchema,
  pharmacologic_effects: tiptapSchema,
  indications: tiptapSchema,
  clinical_application: tiptapSchema,
  adult_dose: tiptapSchema,
  pediatric_dose: tiptapSchema,
  dose_and_dilution: tiptapSchema,
  administration: tiptapSchema,
  onset_time: tiptapSchema,
  transport: tiptapSchema,
  metabolism: tiptapSchema,
  elimination: tiptapSchema,
  adverse_effects: tiptapSchema,
  contraindications: tiptapSchema,
  antidote: tiptapSchema,
  personal_notes: tiptapSchema,
  bibliography: tiptapSchema
};

const medicationSchema = z.object({
  ...baseUserRecord,
  generic_name: nullableString,
  pharmacologic_group: nullableString,
  pharmacologic_subgroup: nullableString,
  short_description: nullableString,
  status: z.enum(['draft', 'complete']),
  is_favorite: z.boolean(),
  search_text: z.string(),
  classification_mechanism_json: tiptapSchema.optional().default(defaultTipTapDocument),
  classification_mechanism_html: z.string().optional().default('<p></p>'),
  clinical_uses_json: tiptapSchema.optional().default(defaultTipTapDocument),
  clinical_uses_html: z.string().optional().default('<p></p>'),
  dosing_administration_json: tiptapSchema.optional().default(defaultTipTapDocument),
  dosing_administration_html: z.string().optional().default('<p></p>'),
  safety_json: tiptapSchema.optional().default(defaultTipTapDocument),
  safety_html: z.string().optional().default('<p></p>'),
  ...medicationRichFields
});

const medicationTagSchema = z.object({
  medication_id: uuidSchema,
  tag_id: uuidSchema,
  user_id: uuidSchema,
  created_at: isoDateSchema
});

const medicationAttachmentSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  medication_id: uuidSchema,
  attachment_id: uuidSchema,
  created_at: isoDateSchema
});

const manifestSchema = z.object({
  backup_format: z.literal(backupFormat),
  backup_version: z.number(),
  app_version: z.string(),
  created_at: isoDateSchema,
  exported_by_user_id: uuidSchema,
  complete: z.boolean(),
  counts: z.record(z.number()),
  approximate_total_size: z.number(),
  checksum_algorithm: z.literal('SHA-256'),
  checksums: z.object({
    data: z.record(z.string()),
    files: z.record(z.string())
  }),
  files: z.array(
    z.object({
      attachment_id: uuidSchema,
      path: z.string(),
      original_filename: z.string(),
      mime_type: z.string(),
      size: z.number(),
      source: z.enum(['supabase-storage', 'indexeddb-local-blob']),
      checksum: z.string()
    })
  ),
  warnings: z.array(z.string())
});

const requiredDataFiles = [
  'data/profile.json',
  'data/organization.json',
  'data/topics.json',
  'data/medications.json',
  'data/attachments.json',
  'data/attachment_links.json',
  'data/topic_attachments.json',
  'data/medication_attachments.json',
  'data/user_settings.json'
];

const v2DataFiles = ['data/topic_relations.json'];

function check(label: string, status: BackupValidationCheck['status'], message: string): BackupValidationCheck {
  return { label, status, message };
}

async function sha256(blob: Blob | string) {
  const buffer = typeof blob === 'string' ? new TextEncoder().encode(blob) : await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function readJson<T>(zip: JSZip, path: string): Promise<T> {
  const file = zip.file(path);
  if (!file) throw new Error(`Falta ${path}`);
  return JSON.parse(await file.async('string')) as T;
}

function collectMedicalImageIds(document: unknown, ids = new Set<string>()) {
  if (!document || typeof document !== 'object') return ids;
  if (Array.isArray(document)) {
    document.forEach((item) => collectMedicalImageIds(item, ids));
    return ids;
  }
  const node = document as { type?: unknown; attrs?: { attachmentId?: unknown }; content?: unknown[] };
  if (node.type === 'medicalImage' && typeof node.attrs?.attachmentId === 'string') ids.add(node.attrs.attachmentId);
  if (Array.isArray(node.content)) node.content.forEach((item) => collectMedicalImageIds(item, ids));
  return ids;
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

export async function validateBackupZip(file: File): Promise<BackupValidationResult> {
  const checks: BackupValidationCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let manifest: BackupManifest | null = null;
  const counts: Record<string, number> = {};

  try {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    const entryNames = entries.map((entry) => entry.name);

    checks.push(check('Lectura del ZIP', 'ok', `Se leyeron ${entries.length} archivo(s).`));
    if (!zip.file('manifest.json')) {
      errors.push('Falta manifest.json.');
      checks.push(check('Manifest', 'error', 'No se encontró manifest.json.'));
      return { status: 'invalid', manifest: null, checks, errors, warnings, counts, size: file.size };
    }

    const manifestRaw = await zip.file('manifest.json')!.async('string');
    const parsedManifest = manifestSchema.safeParse(JSON.parse(manifestRaw));
    if (!parsedManifest.success) {
      errors.push('manifest.json tiene una estructura inválida.');
      checks.push(check('Manifest', 'error', parsedManifest.error.errors.map((issue) => issue.message).join(', ')));
      return { status: 'invalid', manifest: null, checks, errors, warnings, counts, size: file.size };
    }

    manifest = parsedManifest.data as BackupManifest;
    checks.push(check('Manifest', 'ok', 'manifest.json es válido.'));

    if (![1, 2, backupVersion].includes(manifest.backup_version)) {
      errors.push(`Versión de respaldo no compatible: ${manifest.backup_version}.`);
      checks.push(check('Versión', 'error', `Se esperaba versión 1, 2 o ${backupVersion}.`));
    } else {
      checks.push(check('Versión', 'ok', `Formato ${manifest.backup_format} v${manifest.backup_version}.`));
    }

    const requiredForVersion = manifest.backup_version >= 2 ? [...requiredDataFiles, ...v2DataFiles] : requiredDataFiles;
    const missingJson = requiredForVersion.filter((path) => !zip.file(path));
    if (missingJson.length > 0) {
      errors.push(`Faltan JSON requeridos: ${missingJson.join(', ')}.`);
      checks.push(check('JSON requeridos', 'error', `Faltan ${missingJson.length} archivo(s).`));
    } else {
      checks.push(check('JSON requeridos', 'ok', 'Todos los JSON requeridos están presentes.'));
    }

    const duplicateEntries = findDuplicates(entryNames);
    if (duplicateEntries.length > 0) {
      errors.push(`Hay rutas duplicadas dentro del ZIP: ${duplicateEntries.join(', ')}.`);
      checks.push(check('Duplicados ZIP', 'error', `${duplicateEntries.length} ruta(s) duplicada(s).`));
    } else {
      checks.push(check('Duplicados ZIP', 'ok', 'No hay rutas duplicadas.'));
    }

    const profile = profileSchema.safeParse(await readJson(zip, 'data/profile.json'));
    const organization = z
      .object({
        folders: z.array(organizationItemSchema),
        categories: z.array(organizationItemSchema),
        tags: z.array(organizationItemSchema),
        topic_tags: z.array(topicTagSchema),
        medication_tags: z.array(medicationTagSchema)
      })
      .safeParse(await readJson(zip, 'data/organization.json'));
    const topics = z.array(topicSchema).safeParse(await readJson(zip, 'data/topics.json'));
    const topicRelations = zip.file('data/topic_relations.json')
      ? z.array(topicRelationSchema).safeParse(await readJson(zip, 'data/topic_relations.json'))
      : z.array(topicRelationSchema).safeParse([]);
    const medications = z.array(medicationSchema).safeParse(await readJson(zip, 'data/medications.json'));
    const attachments = z.array(attachmentSchema).safeParse(await readJson(zip, 'data/attachments.json'));
    const attachmentLinks = z.array(attachmentLinkSchema).safeParse(await readJson(zip, 'data/attachment_links.json'));
    const topicAttachments = z.array(topicAttachmentSchema).safeParse(await readJson(zip, 'data/topic_attachments.json'));
    const medicationAttachments = z.array(medicationAttachmentSchema).safeParse(await readJson(zip, 'data/medication_attachments.json'));

    const schemaResults = { profile, organization, topics, topicRelations, medications, attachments, attachmentLinks, topicAttachments, medicationAttachments };
    const schemaErrors = Object.entries(schemaResults).filter(([, result]) => !result.success);
    if (schemaErrors.length > 0) {
      schemaErrors.forEach(([name]) => errors.push(`${name} tiene estructura inválida.`));
      checks.push(check('Validación Zod', 'error', `${schemaErrors.length} grupo(s) con errores de estructura.`));
    } else {
      checks.push(check('Validación Zod', 'ok', 'Todos los JSON cumplen la estructura esperada.'));
    }

    if (!organization.success || !topics.success || !topicRelations.success || !medications.success || !attachments.success || !attachmentLinks.success || !topicAttachments.success || !medicationAttachments.success) {
      return { status: 'invalid', manifest, checks, errors, warnings, counts, size: file.size };
    }

    counts.profile = profile.success && profile.data ? 1 : 0;
    counts.folders = organization.data.folders.length;
    counts.categories = organization.data.categories.length;
    counts.tags = organization.data.tags.length;
    counts.topic_tags = organization.data.topic_tags.length;
    counts.medication_tags = organization.data.medication_tags.length;
    counts.topics = topics.data.length;
    counts.topic_relations = topicRelations.data.length;
    counts.medications = medications.data.length;
    counts.attachments = attachments.data.length;
    counts.attachment_links = attachmentLinks.data.length;
    counts.topic_attachments = topicAttachments.data.length;
    counts.medication_attachments = medicationAttachments.data.length;
    counts.files = manifest.files.length;

    const parsedBackupVersion = manifest.backup_version;
    const manifestCounts = manifest.counts as Record<string, number>;
    const countMismatches = Object.entries(counts).filter(([key, value]) => {
      if (parsedBackupVersion === 1 && key === 'topic_relations' && manifestCounts[key] === undefined) return false;
      return manifestCounts[key] !== value;
    });
    if (countMismatches.length > 0) {
      errors.push(`Las cantidades del manifest no coinciden: ${countMismatches.map(([key]) => key).join(', ')}.`);
      checks.push(check('Cantidades', 'error', `${countMismatches.length} cantidad(es) no coinciden.`));
    } else {
      checks.push(check('Cantidades', 'ok', 'Las cantidades coinciden con el contenido real.'));
    }

    const checksumErrors: string[] = [];
    for (const [path, expected] of Object.entries(manifest.checksums.data)) {
      const zipFile = zip.file(path);
      if (!zipFile) {
        checksumErrors.push(`Falta ${path}`);
        continue;
      }
      const actual = await sha256(await zipFile.async('string'));
      if (actual !== expected) checksumErrors.push(path);
    }
    for (const [path, expected] of Object.entries(manifest.checksums.files)) {
      const zipFile = zip.file(path);
      if (!zipFile) {
        checksumErrors.push(`Falta ${path}`);
        continue;
      }
      const actual = await sha256(await zipFile.async('blob'));
      if (actual !== expected) checksumErrors.push(path);
    }
    if (checksumErrors.length > 0) {
      errors.push(`Checksums inválidos o faltantes: ${checksumErrors.join(', ')}.`);
      checks.push(check('Checksums SHA-256', 'error', `${checksumErrors.length} archivo(s) no coinciden.`));
    } else {
      checks.push(check('Checksums SHA-256', 'ok', 'Todos los checksums coinciden.'));
    }

    const attachmentIds = new Set(attachments.data.map((item) => item.id));
    const topicIds = new Set(topics.data.map((item) => item.id));
    const medicationIds = new Set(medications.data.map((item) => item.id));
    const tagIds = new Set(organization.data.tags.map((item) => item.id));
    const folderIds = new Set(organization.data.folders.map((item) => item.id));
    const categoryIds = new Set(organization.data.categories.map((item) => item.id));
    const duplicateIds = [
      ...findDuplicates(attachments.data.map((item) => item.id)),
      ...findDuplicates(topics.data.map((item) => item.id)),
      ...findDuplicates(topicRelations.data.map((item) => item.id)),
      ...findDuplicates(medications.data.map((item) => item.id)),
      ...findDuplicates(organization.data.folders.map((item) => item.id)),
      ...findDuplicates(organization.data.categories.map((item) => item.id)),
      ...findDuplicates(organization.data.tags.map((item) => item.id))
    ];
    if (duplicateIds.length > 0) {
      errors.push(`UUID duplicados: ${duplicateIds.join(', ')}.`);
      checks.push(check('UUID únicos', 'error', `${duplicateIds.length} UUID duplicado(s).`));
    } else {
      checks.push(check('UUID únicos', 'ok', 'No hay UUID duplicados en entidades principales.'));
    }

    const brokenReferences: string[] = [];
    topics.data.forEach((topic) => {
      if (topic.folder_id && !folderIds.has(topic.folder_id)) brokenReferences.push(`Tema ${topic.id} apunta a carpeta inexistente.`);
      if (topic.category_id && !categoryIds.has(topic.category_id)) brokenReferences.push(`Tema ${topic.id} apunta a categoría inexistente.`);
      collectMedicalImageIds(topic.content_json).forEach((id) => {
        if (!attachmentIds.has(id)) brokenReferences.push(`Tema ${topic.id} contiene medicalImage sin attachment ${id}.`);
      });
    });
    const relationKeys = new Set<string>();
    topicRelations.data.forEach((item) => {
      if (item.source_topic_id === item.target_topic_id) brokenReferences.push(`topic_relations ${item.id} relaciona un tema consigo mismo.`);
      if (!topicIds.has(item.source_topic_id)) brokenReferences.push(`topic_relations apunta a tema origen inexistente ${item.source_topic_id}.`);
      if (!topicIds.has(item.target_topic_id)) brokenReferences.push(`topic_relations apunta a tema destino inexistente ${item.target_topic_id}.`);
      const key = `${item.source_topic_id}:${item.target_topic_id}:${item.relation_type}`;
      const relatedKey = [item.source_topic_id, item.target_topic_id].sort().join(':');
      const uniqueKey = item.relation_type === 'related' ? `related:${relatedKey}` : key;
      if (relationKeys.has(uniqueKey)) brokenReferences.push(`topic_relations tiene relación duplicada ${item.id}.`);
      relationKeys.add(uniqueKey);
    });
    organization.data.topic_tags.forEach((item) => {
      if (!topicIds.has(item.topic_id)) brokenReferences.push(`topic_tags apunta a tema inexistente ${item.topic_id}.`);
      if (!tagIds.has(item.tag_id)) brokenReferences.push(`topic_tags apunta a etiqueta inexistente ${item.tag_id}.`);
    });
    organization.data.medication_tags.forEach((item) => {
      if (!medicationIds.has(item.medication_id)) brokenReferences.push(`medication_tags apunta a medicamento inexistente ${item.medication_id}.`);
      if (!tagIds.has(item.tag_id)) brokenReferences.push(`medication_tags apunta a etiqueta inexistente ${item.tag_id}.`);
    });
    topicAttachments.data.forEach((item) => {
      if (!topicIds.has(item.topic_id)) brokenReferences.push(`topic_attachments apunta a tema inexistente ${item.topic_id}.`);
      if (!attachmentIds.has(item.attachment_id)) brokenReferences.push(`topic_attachments apunta a attachment inexistente ${item.attachment_id}.`);
    });
    medicationAttachments.data.forEach((item) => {
      if (!medicationIds.has(item.medication_id)) brokenReferences.push(`medication_attachments apunta a medicamento inexistente ${item.medication_id}.`);
      if (!attachmentIds.has(item.attachment_id)) brokenReferences.push(`medication_attachments apunta a attachment inexistente ${item.attachment_id}.`);
    });
    attachmentLinks.data.forEach((item) => {
      if (!attachmentIds.has(item.attachment_id)) brokenReferences.push(`attachment_links apunta a attachment inexistente ${item.attachment_id}.`);
    });
    medications.data.forEach((medication) => {
      Object.values(medication).forEach((value) => {
        collectMedicalImageIds(value).forEach((id) => {
          if (!attachmentIds.has(id)) brokenReferences.push(`Medicamento ${medication.id} contiene medicalImage sin attachment ${id}.`);
        });
      });
    });
    if (brokenReferences.length > 0) {
      errors.push(...brokenReferences);
      checks.push(check('Referencias', 'error', `${brokenReferences.length} referencia(s) rota(s).`));
    } else {
      checks.push(check('Referencias', 'ok', 'No se detectaron referencias rotas.'));
    }

    const filePaths = manifest.files.map((item) => item.path);
    const duplicateFilePaths = findDuplicates(filePaths);
    if (duplicateFilePaths.length > 0) {
      errors.push(`Archivos físicos duplicados: ${duplicateFilePaths.join(', ')}.`);
      checks.push(check('Archivos duplicados', 'error', `${duplicateFilePaths.length} archivo(s) duplicado(s).`));
    } else {
      checks.push(check('Archivos duplicados', 'ok', 'No hay archivos físicos duplicados.'));
    }

    const manifestAttachmentIds = new Set(manifest.files.map((item) => item.attachment_id));
    const attachmentsWithoutFiles = attachments.data.filter((item) => !manifestAttachmentIds.has(item.id));
    if (attachmentsWithoutFiles.length > 0) {
      warnings.push(`${attachmentsWithoutFiles.length} attachment(s) no tienen archivo físico incluido.`);
      checks.push(check('Attachments con archivo', 'warning', `${attachmentsWithoutFiles.length} attachment(s) sin archivo físico.`));
    } else {
      checks.push(check('Attachments con archivo', 'ok', 'Todos los attachments tienen archivo físico.'));
    }

    const filesWithoutAttachment = manifest.files.filter((item) => !attachmentIds.has(item.attachment_id));
    if (filesWithoutAttachment.length > 0) {
      errors.push(`${filesWithoutAttachment.length} archivo(s) físicos no tienen attachment asociado.`);
      checks.push(check('Archivos huérfanos', 'error', `${filesWithoutAttachment.length} archivo(s) sin attachment.`));
    } else {
      checks.push(check('Archivos huérfanos', 'ok', 'No hay archivos físicos huérfanos.'));
    }

    const missingPhysicalFiles = manifest.files.filter((item) => !zip.file(item.path));
    if (missingPhysicalFiles.length > 0) {
      errors.push(`${missingPhysicalFiles.length} archivo(s) físico(s) faltan dentro del ZIP.`);
      checks.push(check('Archivos obligatorios', 'error', `${missingPhysicalFiles.length} archivo(s) faltante(s).`));
    } else {
      checks.push(check('Archivos obligatorios', 'ok', 'Todos los archivos físicos declarados existen.'));
    }

    warnings.push(...manifest.warnings);
    if (manifest.warnings.length > 0) checks.push(check('Advertencias del manifest', 'warning', `${manifest.warnings.length} advertencia(s) declarada(s).`));

    const status = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'valid-with-warnings' : 'valid';
    return { status, manifest, checks, errors, warnings, counts, size: file.size };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'No se pudo analizar el ZIP.');
    checks.push(check('Análisis', 'error', 'El archivo no pudo analizarse como respaldo válido.'));
    return { status: 'invalid', manifest, checks, errors, warnings, counts, size: file.size };
  }
}
