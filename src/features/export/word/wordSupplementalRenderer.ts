import { Paragraph, TextRun } from 'docx';
import type { ExportAttachmentReference, ExportDocument } from '../exportTypes';
import { formatAttachmentOwner, formatDocumentType, formatFileSize, stableReferenceKey } from './wordFormatters';
import { wordParagraphStyles } from './wordStyles';

export function renderMetadataParagraphs(document: ExportDocument): Paragraph[] {
  const rows = [
    ['Tipo', formatDocumentType(document.type)],
    ['Autor', stringValue(document.metadata.author)],
    ['Fecha de exportación', formatDateValue(document.metadata.exportedAt)],
    ['Fecha de actualización', formatDateValue(document.metadata.updatedAt)],
    ['Versión del exportador', stringValue(document.metadata.exporterVersion)]
  ].filter(([, value]) => value);

  if (rows.length === 0) return [];

  return [
    new Paragraph({
      text: 'Datos de exportación',
      style: wordParagraphStyles.metadataHeading
    }),
    ...rows.map(
      ([label, value]) =>
        new Paragraph({
          children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value })],
          style: wordParagraphStyles.metadata
        })
    )
  ];
}

export function renderAttachmentParagraphs(attachments: ExportAttachmentReference[]): Paragraph[] {
  const uniqueAttachments = dedupeAttachments(attachments);
  if (uniqueAttachments.length === 0) return [];

  return [
    new Paragraph({
      text: 'Archivos adjuntos',
      style: wordParagraphStyles.attachmentHeading
    }),
    ...uniqueAttachments.map((attachment) => {
      const details = [attachment.mimeType, formatFileSize(attachment.size), formatAttachmentOwner(attachment.ownerType)].filter(Boolean).join(' · ');
      return new Paragraph({
        children: [
          new TextRun({ text: attachment.name || 'Archivo sin nombre', bold: true }),
          ...(details ? [new TextRun({ text: ` (${details})` })] : [])
        ],
        style: wordParagraphStyles.attachmentItem
      });
    })
  ];
}

function dedupeAttachments(attachments: ExportAttachmentReference[]) {
  const seen = new Set<string>();
  return attachments.filter((attachment) => {
    const key = stableReferenceKey(attachment);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function formatDateValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
