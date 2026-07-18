import type { ExportDocument } from '../exportTypes';

export function createWordFileName(document: Pick<ExportDocument, 'title'>) {
  const baseName = document.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${baseName || 'documento-medico'}.docx`;
}
