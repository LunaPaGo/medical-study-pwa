import { Document, Packer, Paragraph } from 'docx';
import type { ExportDocument } from '../exportTypes';
import { renderWordBlocks } from './wordBlockRenderer';
import { wordNumberingConfig } from './wordNumbering';
import { headingLevelFor, wordDocumentStyles, wordParagraphStyles } from './wordStyles';

export async function createWordDocument(exportDocument: ExportDocument): Promise<Blob> {
  let listInstance = 1;
  const renderContext = {
    nextListInstance: () => listInstance++
  };

  const children = [
    titleParagraph(exportDocument.title),
    subtitleParagraph(exportDocument.subtitle),
    ...exportDocument.sections.flatMap((section) => {
      const sectionBlocks = renderWordBlocks(section.blocks, renderContext);
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
    numbering: wordNumberingConfig,
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
