import { Document, Packer, Paragraph } from 'docx';
import type { ExportBlock, ExportDocument, ExportHeadingBlock, ExportParagraphBlock } from '../exportTypes';
import { headingLevelFor, wordDocumentStyles, wordParagraphStyles } from './wordStyles';
import { renderWordTextRuns } from './wordTextRenderer';

export async function createWordDocument(exportDocument: ExportDocument): Promise<Blob> {
  const children = [
    titleParagraph(exportDocument.title),
    subtitleParagraph(exportDocument.subtitle),
    ...exportDocument.sections.flatMap((section) => {
      const sectionBlocks = section.blocks.flatMap(renderSupportedBlock);
      if (sectionBlocks.length === 0) return [];

      return [
        new Paragraph({
          text: section.title,
          heading: headingLevelFor(section.level)
        }),
        ...sectionBlocks
      ];
    })
  ].filter((paragraph): paragraph is Paragraph => Boolean(paragraph));

  const document = new Document({
    styles: wordDocumentStyles,
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBlob(document);
}

function titleParagraph(title: string) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  return new Paragraph({
    text: cleanTitle,
    style: wordParagraphStyles.title
  });
}

function subtitleParagraph(subtitle: string | undefined) {
  const cleanSubtitle = subtitle?.trim();
  if (!cleanSubtitle) return null;

  return new Paragraph({
    text: cleanSubtitle,
    style: wordParagraphStyles.subtitle
  });
}

function renderSupportedBlock(block: ExportBlock): Paragraph[] {
  if (block.type === 'paragraph') {
    return renderParagraphBlock(block);
  }

  if (block.type === 'heading') {
    return renderHeadingBlock(block);
  }

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
