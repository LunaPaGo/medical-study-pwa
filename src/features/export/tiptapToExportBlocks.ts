import type { TipTapDocument } from '../../types/topic';
import type { ExportBlock, ExportImageReference, ExportImageReferenceBlock, ExportTextRun } from './exportTypes';

type ConversionResult = {
  blocks: ExportBlock[];
  images: ExportImageReference[];
};

type TipTapNode = TipTapDocument & {
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export function tiptapToExportBlocks(document: unknown, sectionId: string, sectionTitle: string): ConversionResult {
  const images: ExportImageReference[] = [];
  const blocks = convertChildren(asNode(document)?.content, { sectionId, sectionTitle, images });
  return { blocks, images };
}

function convertChildren(content: unknown, context: ConversionContext): ExportBlock[] {
  if (!Array.isArray(content)) return [];
  return content.flatMap((child) => convertNode(child, context));
}

type ConversionContext = {
  sectionId: string;
  sectionTitle: string;
  images: ExportImageReference[];
};

function convertNode(value: unknown, context: ConversionContext): ExportBlock[] {
  const node = asNode(value);
  if (!node) return [];

  if (node.type === 'paragraph') {
    return [{ type: 'paragraph', children: collectInlineText(node) }];
  }

  if (node.type === 'heading') {
    return [{ type: 'heading', level: levelFromAttrs(node.attrs), children: collectInlineText(node) }];
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return [
      {
        type: node.type === 'bulletList' ? 'bulletList' : 'numberedList',
        items: listItemsFromNode(node, context)
      }
    ];
  }

  if (node.type === 'table') {
    return [tableFromNode(node, context)];
  }

  if (node.type === 'medicalImage' || node.type === 'image') {
    return [imageReferenceFromNode(node, context)];
  }

  if (node.type === 'horizontalRule') {
    return [{ type: 'horizontalRule' }];
  }

  if (node.type === 'codeBlock') {
    return [{ type: 'codeBlock', text: collectPlainText(node), language: stringAttr(node.attrs, 'language') }];
  }

  if (node.type === 'blockquote') {
    return [{ type: 'quote', blocks: convertChildren(node.content, context) }];
  }

  if (node.text) {
    return [{ type: 'paragraph', children: [textRunFromNode(node)] }];
  }

  return convertChildren(node.content, context);
}

function listItemsFromNode(node: TipTapNode, context: ConversionContext) {
  return (Array.isArray(node.content) ? node.content : [])
    .map((item) => ({
      blocks: convertChildren(asNode(item)?.content, context)
    }))
    .filter((item) => item.blocks.length > 0);
}

function tableFromNode(node: TipTapNode, context: ConversionContext): ExportBlock {
  const rows = (Array.isArray(node.content) ? node.content : []).flatMap((row) => {
    const rowNode = asNode(row);
    if (!rowNode || rowNode.type !== 'tableRow') return [];

    return [
      {
        cells: (Array.isArray(rowNode.content) ? rowNode.content : []).flatMap((cell) => {
          const cellNode = asNode(cell);
          if (!cellNode || (cellNode.type !== 'tableCell' && cellNode.type !== 'tableHeader')) return [];
          return [
            {
              blocks: convertChildren(cellNode.content, context),
              header: cellNode.type === 'tableHeader'
            }
          ];
        })
      }
    ];
  });

  return { type: 'table', rows };
}

function imageReferenceFromNode(node: TipTapNode, context: ConversionContext): ExportImageReferenceBlock {
  const reference: ExportImageReference = {
    id: stringAttr(node.attrs, 'attachmentId') ?? stringAttr(node.attrs, 'id'),
    src: stringAttr(node.attrs, 'src'),
    alt: stringAttr(node.attrs, 'alt'),
    title: stringAttr(node.attrs, 'title'),
    width: numberAttr(node.attrs, 'width'),
    height: numberAttr(node.attrs, 'height'),
    caption: stringAttr(node.attrs, 'caption'),
    position: `${context.sectionId}:${context.images.length + 1}`,
    sectionId: context.sectionId,
    sectionTitle: context.sectionTitle
  };
  context.images.push(reference);

  return { type: 'imageReference', ...reference };
}

function collectInlineText(node: TipTapNode): ExportTextRun[] {
  const runs: ExportTextRun[] = [];
  collectInlineTextInto(node, runs);
  return runs;
}

function collectInlineTextInto(node: TipTapNode, runs: ExportTextRun[]) {
  if (typeof node.text === 'string') {
    runs.push(textRunFromNode(node));
  }

  if (node.type === 'hardBreak') {
    runs.push({ type: 'text', text: '\n' });
  }

  if (Array.isArray(node.content)) {
    node.content.forEach((child) => {
      const childNode = asNode(child);
      if (childNode) collectInlineTextInto(childNode, runs);
    });
  }
}

function collectPlainText(node: TipTapNode): string {
  const parts: string[] = [];
  const visit = (current: TipTapNode) => {
    if (typeof current.text === 'string') parts.push(current.text);
    if (Array.isArray(current.content)) {
      current.content.forEach((child) => {
        const childNode = asNode(child);
        if (childNode) visit(childNode);
      });
    }
  };
  visit(node);
  return parts.join('');
}

function textRunFromNode(node: TipTapNode): ExportTextRun {
  return {
    type: 'text',
    text: node.text ?? '',
    ...marksFromNode(node)
  };
}

function marksFromNode(node: TipTapNode): Partial<ExportTextRun> {
  return (node.marks ?? []).reduce<Partial<ExportTextRun>>((marks, mark) => {
    if (mark.type === 'bold') return { ...marks, bold: true };
    if (mark.type === 'italic') return { ...marks, italic: true };
    if (mark.type === 'underline') return { ...marks, underline: true };
    if (mark.type === 'code') return { ...marks, code: true };
    if (mark.type === 'link') return { ...marks, link: stringAttr(mark.attrs, 'href') };
    return marks;
  }, {});
}

function asNode(value: unknown): TipTapNode | null {
  return value && typeof value === 'object' ? (value as TipTapNode) : null;
}

function levelFromAttrs(attrs: Record<string, unknown> | undefined) {
  const level = numberAttr(attrs, 'level');
  return level && level >= 1 && level <= 6 ? level : 2;
}

function stringAttr(attrs: Record<string, unknown> | undefined, key: string) {
  const value = attrs?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberAttr(attrs: Record<string, unknown> | undefined, key: string) {
  const value = attrs?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
