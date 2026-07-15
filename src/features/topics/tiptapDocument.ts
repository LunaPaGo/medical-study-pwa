import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import type { TipTapDocument } from '../../types/topic';
import { MedicalImageNode } from '../attachments/MedicalImageNode';

export const emptyTipTapDocument: TipTapDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};

const tiptapExtensions = [
  StarterKit,
  Underline,
  Highlight,
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  MedicalImageNode
];

export function isEmptyTipTapDocument(document: TipTapDocument | null | undefined) {
  if (!document || typeof document !== 'object') return true;

  return JSON.stringify(document) === JSON.stringify(emptyTipTapDocument);
}

export function getTopicDocument(document: TipTapDocument | null | undefined): TipTapDocument {
  if (document && typeof document === 'object') {
    return document;
  }

  return emptyTipTapDocument;
}

export function htmlToTipTapDocument(html: string): TipTapDocument {
  if (!html.trim()) return emptyTipTapDocument;

  try {
    return generateJSON(html, tiptapExtensions) as TipTapDocument;
  } catch {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }]
        }
      ]
    };
  }
}

export function getDocumentForTopic(document: TipTapDocument | null | undefined, html: string): {
  document: TipTapDocument;
  wasConvertedFromHtml: boolean;
} {
  if (!isEmptyTipTapDocument(document)) {
    return { document: getTopicDocument(document), wasConvertedFromHtml: false };
  }

  const plainHtml = html.trim();
  if (!plainHtml || plainHtml === '<p></p>') {
    return { document: emptyTipTapDocument, wasConvertedFromHtml: false };
  }

  return { document: htmlToTipTapDocument(html), wasConvertedFromHtml: true };
}
