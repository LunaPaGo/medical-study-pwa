import type { ExportAttachmentReference, ExportDocument, ExportImageReferenceBlock } from '../exportTypes';

const documentTypeLabels: Record<ExportDocument['type'], string> = {
  topic: 'Tema',
  medication: 'Fármaco',
  procedure: 'Procedimiento'
};

const ownerTypeLabels: Record<string, string> = {
  topic: 'Tema',
  medication: 'Fármaco',
  procedure: 'Procedimiento'
};

export function formatDocumentType(type: ExportDocument['type']) {
  return documentTypeLabels[type];
}

export function formatAttachmentOwner(ownerType: ExportAttachmentReference['ownerType']) {
  return ownerTypeLabels[ownerType] ?? 'Contenido';
}

export function formatFileSize(size: number | null | undefined) {
  if (!size || size <= 0) return '';
  if (size < 1024) return `${size} bytes`;

  const kilobytes = size / 1024;
  if (kilobytes < 1024) return `${formatDecimal(kilobytes)} KB`;

  return `${formatDecimal(kilobytes / 1024)} MB`;
}

export function imageReferenceLabel(image: ExportImageReferenceBlock) {
  const name = image.caption || image.title || image.alt;
  const dimensions = image.width && image.height ? ` (${image.width} x ${image.height}px)` : '';
  return `[Imagen: ${name?.trim() || 'sin descripción'}${dimensions}]`;
}

export function stableReferenceKey(value: { id?: string; title?: string; alt?: string; src?: string; name?: string; mimeType?: string }) {
  if (value.id) return `id:${value.id}`;
  return [value.name, value.title, value.alt, value.mimeType, value.src].filter(Boolean).join('|').toLowerCase();
}

function formatDecimal(value: number) {
  const rounded = value >= 10 ? Math.round(value).toString() : value.toFixed(1);
  return rounded.replace('.', ',');
}
