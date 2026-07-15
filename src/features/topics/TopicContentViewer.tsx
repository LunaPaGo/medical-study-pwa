import { EditorContent, useEditor } from '@tiptap/react';
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

export function TopicContentViewer({ content }: { content: TipTapDocument }) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({ openOnClick: true }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      MedicalImageNode
    ],
    content,
    editorProps: {
      attributes: {
        class: 'reader-content'
      }
    }
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
