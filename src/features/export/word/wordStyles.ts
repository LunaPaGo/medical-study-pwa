import { HeadingLevel } from 'docx';

export const wordParagraphStyles = {
  title: 'MedicalDocumentTitle',
  subtitle: 'MedicalDocumentSubtitle',
  normal: 'MedicalDocumentNormal'
} as const;

export function headingLevelFor(sectionLevel: number) {
  if (sectionLevel <= 1) return HeadingLevel.HEADING_1;
  if (sectionLevel === 2) return HeadingLevel.HEADING_2;
  if (sectionLevel === 3) return HeadingLevel.HEADING_3;
  return HeadingLevel.HEADING_4;
}

export const wordDocumentStyles = {
  default: {
    document: {
      run: {
        font: 'Arial',
        size: 22
      },
      paragraph: {
        spacing: { after: 160 }
      }
    }
  },
  paragraphStyles: [
    {
      id: wordParagraphStyles.title,
      name: 'Medical Document Title',
      basedOn: 'Normal',
      next: wordParagraphStyles.normal,
      run: {
        bold: true,
        size: 34,
        font: 'Arial'
      },
      paragraph: {
        spacing: { after: 180 }
      }
    },
    {
      id: wordParagraphStyles.subtitle,
      name: 'Medical Document Subtitle',
      basedOn: 'Normal',
      next: wordParagraphStyles.normal,
      run: {
        color: '4B5563',
        size: 24,
        font: 'Arial'
      },
      paragraph: {
        spacing: { after: 260 }
      }
    },
    {
      id: wordParagraphStyles.normal,
      name: 'Medical Document Normal',
      basedOn: 'Normal',
      run: {
        size: 22,
        font: 'Arial'
      },
      paragraph: {
        spacing: { after: 160 },
        line: 320
      }
    }
  ]
};
