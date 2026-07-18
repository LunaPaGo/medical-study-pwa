import { BorderStyle, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, WidthType } from 'docx';
import type {
  ExportBlock,
  ExportCodeBlock,
  ExportHeadingBlock,
  ExportImageReferenceBlock,
  ExportListBlock,
  ExportParagraphBlock,
  ExportQuoteBlock,
  ExportTableBlock,
  ExportTableCell
} from '../exportTypes';
import { wordNumberingReferences } from './wordNumbering';
import { imageReferenceLabel, stableReferenceKey } from './wordFormatters';
import { headingLevelFor, wordParagraphStyles } from './wordStyles';
import { renderWordTextRuns } from './wordTextRenderer';

export type WordRenderableBlock = Paragraph | Table;

type RenderContext = {
  nextListInstance: () => number;
  renderedImageKeys: Set<string>;
};

export function renderWordBlocks(blocks: ExportBlock[], context: RenderContext): WordRenderableBlock[] {
  return blocks.flatMap((block) => renderWordBlock(block, context, 0));
}

function renderWordBlock(block: ExportBlock, context: RenderContext, level: number): WordRenderableBlock[] {
  if (block.type === 'paragraph') return renderParagraphBlock(block);
  if (block.type === 'heading') return renderHeadingBlock(block);
  if (block.type === 'bulletList' || block.type === 'numberedList') return renderListBlock(block, context, level);
  if (block.type === 'table') return renderTableBlock(block, context);
  if (block.type === 'horizontalRule') return renderHorizontalRule();
  if (block.type === 'quote') return renderQuoteBlock(block, context);
  if (block.type === 'codeBlock') return renderCodeBlock(block);
  if (block.type === 'imageReference') return renderImageReferenceBlock(block, context);
  return [];
}

function renderParagraphBlock(block: ExportParagraphBlock) {
  const children = renderWordTextRuns(block.children);
  if (children.length === 0) return [];

  return [
    new Paragraph({
      children,
      style: wordParagraphStyles.normal
    })
  ];
}

function renderHeadingBlock(block: ExportHeadingBlock) {
  const children = renderWordTextRuns(block.children);
  if (children.length === 0) return [];

  return [
    new Paragraph({
      children,
      heading: headingLevelFor(block.level + 1)
    })
  ];
}

function renderListBlock(block: ExportListBlock, context: RenderContext, level: number) {
  const instance = context.nextListInstance();
  return block.items.flatMap((item) => renderListItem(item.blocks, block.type, context, clampListLevel(level), instance));
}

function renderListItem(blocks: ExportBlock[], listType: ExportListBlock['type'], context: RenderContext, level: number, instance: number): WordRenderableBlock[] {
  const [firstBlock, ...restBlocks] = blocks;
  const children = firstBlock ? inlineChildrenFromBlock(firstBlock) : [];
  const listParagraph =
    children.length > 0
      ? [
          new Paragraph({
            children,
            style: wordParagraphStyles.normal,
            numbering: {
              reference: listType === 'bulletList' ? wordNumberingReferences.bullet : wordNumberingReferences.numbered,
              level,
              instance
            }
          })
        ]
      : [];

  return [...listParagraph, ...restBlocks.flatMap((block) => renderNestedListOrIndentedBlock(block, context, level, instance, listType))];
}

function renderNestedListOrIndentedBlock(
  block: ExportBlock,
  context: RenderContext,
  level: number,
  instance: number,
  parentListType: ExportListBlock['type']
): WordRenderableBlock[] {
  if (block.type === 'bulletList' || block.type === 'numberedList') {
    return block.items.flatMap((item) => renderListItem(item.blocks, block.type, context, clampListLevel(level + 1), instance));
  }

  const children = inlineChildrenFromBlock(block);
  if (children.length === 0) return renderWordBlock(block, context, level);

  return [
    new Paragraph({
      children,
      style: wordParagraphStyles.normal,
      indent: { left: 720 + level * 360 },
      numbering: block.type === 'paragraph' ? undefined : {
        reference: parentListType === 'bulletList' ? wordNumberingReferences.bullet : wordNumberingReferences.numbered,
        level,
        instance
      }
    })
  ];
}

function renderTableBlock(block: ExportTableBlock, context: RenderContext) {
  if (block.rows.length === 0) return [];

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
      borders: tableBorders(),
      rows: block.rows.map(
        (row) =>
          new TableRow({
            children: row.cells.map((cell) => renderTableCell(cell, context))
          })
      )
    })
  ];
}

function renderTableCell(cell: ExportTableCell, context: RenderContext) {
  const children = renderBlocksForTableCell(cell.blocks, context);
  return new TableCell({
    shading: cell.header ? { type: ShadingType.CLEAR, fill: 'EAF4F2' } : undefined,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: children.length > 0 ? children : [new Paragraph({ text: '' })]
  });
}

function renderBlocksForTableCell(blocks: ExportBlock[], context: RenderContext): Paragraph[] {
  return renderWordBlocks(blocks, context).flatMap((block) => (block instanceof Paragraph ? [block] : []));
}

function renderHorizontalRule() {
  return [
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, color: 'CBD5E1', size: 8, space: 1 }
      },
      spacing: { before: 160, after: 160 }
    })
  ];
}

function renderQuoteBlock(block: ExportQuoteBlock, context: RenderContext) {
  return block.blocks.flatMap((childBlock) => {
    if (childBlock.type === 'table' || childBlock.type === 'bulletList' || childBlock.type === 'numberedList') {
      return renderWordBlock(childBlock, context, 0);
    }

    const children = inlineChildrenFromBlock(childBlock);
    if (children.length === 0) return [];

    return [
      new Paragraph({
        children,
        style: wordParagraphStyles.quote
      })
    ];
  });
}

function renderCodeBlock(block: ExportCodeBlock) {
  if (!block.text.trim()) return [];

  return block.text.split(/\r?\n/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 20 })],
        style: wordParagraphStyles.code
      })
  );
}

function renderImageReferenceBlock(block: ExportImageReferenceBlock, context: RenderContext) {
  const key = stableReferenceKey(block);
  if (key && context.renderedImageKeys.has(key)) return [];
  if (key) context.renderedImageKeys.add(key);

  return [
    new Paragraph({
      text: imageReferenceLabel(block),
      style: wordParagraphStyles.imageReference
    })
  ];
}

function inlineChildrenFromBlock(block: ExportBlock) {
  if (block.type === 'paragraph' || block.type === 'heading') return renderWordTextRuns(block.children);
  if (block.type === 'codeBlock') return [new TextRun({ text: block.text, font: 'Consolas', size: 20 })];
  return [];
}

function clampListLevel(level: number) {
  return Math.min(Math.max(level, 0), 5);
}

function tableBorders() {
  const border = { style: BorderStyle.SINGLE, color: 'CBD5E1', size: 4 };
  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border
  };
}
