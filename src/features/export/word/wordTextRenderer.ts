import { ExternalHyperlink, TextRun, UnderlineType } from 'docx';
import type { ExportTextRun } from '../exportTypes';

export function renderWordTextRuns(runs: ExportTextRun[]) {
  return runs
    .filter((run) => run.text.length > 0)
    .map((run) => {
      const textRun = new TextRun({
        text: run.text,
        bold: run.bold,
        italics: run.italic,
        underline: run.underline ? { type: UnderlineType.SINGLE } : undefined,
        style: run.link && isValidLink(run.link) ? 'Hyperlink' : undefined
      });

      if (!run.link || !isValidLink(run.link)) return textRun;

      return new ExternalHyperlink({
        children: [textRun],
        link: run.link
      });
    });
}

function isValidLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}
