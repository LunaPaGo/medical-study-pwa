import JSZip from 'jszip';
import type { BackupData, BackupManifest } from './backupTypes';
import { validateBackupZip } from './backupValidation';

type OrganizationBackup = {
  folders: BackupData['folders'];
  categories: BackupData['categories'];
  tags: BackupData['tags'];
  topic_tags: BackupData['topic_tags'];
  medication_tags: BackupData['medication_tags'];
};

export type ParsedBackup = {
  zip: JSZip;
  manifest: BackupManifest;
  data: BackupData;
};

async function readJson<T>(zip: JSZip, path: string): Promise<T> {
  const file = zip.file(path);
  if (!file) throw new Error(`Falta ${path}.`);
  return JSON.parse(await file.async('string')) as T;
}

export async function parseValidatedBackupZip(file: File): Promise<ParsedBackup> {
  const validation = await validateBackupZip(file);
  if (validation.status === 'invalid' || !validation.manifest) {
    throw new Error('El respaldo no pasó la validación.');
  }

  const zip = await JSZip.loadAsync(file);
  const organization = await readJson<OrganizationBackup>(zip, 'data/organization.json');

  return {
    zip,
    manifest: validation.manifest,
    data: {
      profile: await readJson<BackupData['profile']>(zip, 'data/profile.json'),
      folders: organization.folders,
      categories: organization.categories,
      tags: organization.tags,
      topics: await readJson<BackupData['topics']>(zip, 'data/topics.json'),
      topic_relations: zip.file('data/topic_relations.json') ? await readJson<BackupData['topic_relations']>(zip, 'data/topic_relations.json') : [],
      topic_tags: organization.topic_tags,
      medications: await readJson<BackupData['medications']>(zip, 'data/medications.json'),
      medication_tags: organization.medication_tags,
      attachments: await readJson<BackupData['attachments']>(zip, 'data/attachments.json'),
      attachment_links: await readJson<BackupData['attachment_links']>(zip, 'data/attachment_links.json'),
      topic_attachments: await readJson<BackupData['topic_attachments']>(zip, 'data/topic_attachments.json'),
      medication_attachments: await readJson<BackupData['medication_attachments']>(zip, 'data/medication_attachments.json')
    }
  };
}

export async function getBackupFileBlob(parsed: ParsedBackup, attachmentId: string): Promise<Blob | null> {
  const fileEntry = parsed.manifest.files.find((item) => item.attachment_id === attachmentId);
  if (!fileEntry) return null;
  const zipFile = parsed.zip.file(fileEntry.path);
  if (!zipFile) return null;
  return zipFile.async('blob');
}
