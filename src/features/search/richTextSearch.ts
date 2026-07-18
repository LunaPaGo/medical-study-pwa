import type { TipTapDocument } from '../../types/topic';

export type RichTextSearchSection = {
  sectionId: string;
  sectionLabel: string;
  text: string;
};

export function extractSearchTextFromTipTap(document: unknown): string {
  try {
    const parts: string[] = [];
    visitTipTapNode(document, parts);
    return normalizeExtractedText(parts.join(' '));
  } catch {
    return '';
  }
}

export function extractSearchTextFromHtml(html: unknown): string {
  if (typeof html !== 'string') return '';

  return normalizeExtractedText(
    decodeHtmlEntities(
      html
        .replace(/<(br|hr)\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|li|tr|td|th|h[1-6]|blockquote)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

export function extractSearchText(value: unknown) {
  if (typeof value === 'string') return normalizeExtractedText(value);
  return extractSearchTextFromTipTap(value);
}

export function buildRichTextSections<TRecord>(
  source: TRecord,
  sections: Array<{ key: string; title: string; jsonField: keyof TRecord; htmlField: keyof TRecord }>
): RichTextSearchSection[] {
  return sections
    .map((section) => {
      const jsonText = extractSearchTextFromTipTap(source[section.jsonField]);
      const htmlText = extractSearchTextFromHtml(source[section.htmlField]);
      const text = jsonText || htmlText;

      return {
        sectionId: section.key,
        sectionLabel: section.title,
        text
      };
    })
    .filter((section) => section.text.length > 0);
}

function visitTipTapNode(value: unknown, parts: string[]) {
  if (!isTipTapNode(value)) return;

  if (typeof value.text === 'string') {
    parts.push(value.text);
  }

  if (Array.isArray(value.content)) {
    value.content.forEach((child) => visitTipTapNode(child, parts));
  }

  if (isBlockNode(value.type)) {
    parts.push(' ');
  }
}

function isTipTapNode(value: unknown): value is TipTapDocument {
  return Boolean(value && typeof value === 'object');
}

function isBlockNode(type: unknown) {
  return (
    type === 'paragraph' ||
    type === 'heading' ||
    type === 'bulletList' ||
    type === 'orderedList' ||
    type === 'listItem' ||
    type === 'blockquote' ||
    type === 'codeBlock' ||
    type === 'table' ||
    type === 'tableRow' ||
    type === 'horizontalRule'
  );
}

function normalizeExtractedText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
