import { useEffect, useRef } from 'react';
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
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Underline as UnderlineIcon
} from 'lucide-react';
import type { AttachmentOwnerType } from '../../types/attachment';
import type { TipTapDocument } from '../../types/topic';
import { MedicalImageNode } from '../attachments/MedicalImageNode';
import { RichTextAttachmentSupport, type RichTextAttachmentRenderState } from './RichTextAttachmentSupport';
import {
  isRichTextLineSpacing,
  LineSpacingExtension,
  lineSpacingNodeTypes,
  type RichTextLineSpacing
} from './LineSpacingExtension';

type Props = {
  value: TipTapDocument;
  onChange: (value: { json: TipTapDocument; html: string }) => void;
  owner?: { ownerType: AttachmentOwnerType; ownerId: string };
  attachmentsEnabled?: boolean;
};

export function RichTextEditor({ value, onChange, owner, attachmentsEnabled = Boolean(owner) }: Props) {
  const lastEmittedContentRef = useRef('');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ...(attachmentsEnabled ? [MedicalImageNode] : []),
      LineSpacingExtension
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor-content'
      }
    },
    onUpdate({ editor: activeEditor }) {
      const json = activeEditor.getJSON() as TipTapDocument;
      lastEmittedContentRef.current = JSON.stringify(json);
      onChange({
        json,
        html: activeEditor.getHTML()
      });
    }
  });

  useEffect(() => {
    if (!editor) return;

    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (next === lastEmittedContentRef.current) return;
    if (current !== next) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Pegá el enlace', previousUrl ?? 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const activeLineSpacing = lineSpacingNodeTypes
    .map((nodeType) => editor.getAttributes(nodeType).lineSpacing)
    .find(isRichTextLineSpacing) ?? '';

  const setLineSpacing = (lineSpacing: RichTextLineSpacing) => {
    editor
      .chain()
      .focus()
      .updateAttributes('paragraph', { lineSpacing })
      .updateAttributes('heading', { lineSpacing })
      .updateAttributes('listItem', { lineSpacing })
      .run();
  };

  const renderEditor = (attachmentSupport?: RichTextAttachmentRenderState) => (
    <div className={`rich-editor ${attachmentSupport?.containerClassName ?? ''}`} {...attachmentSupport?.containerEvents}>
      {attachmentSupport?.inputs}
      <div className="editor-toolbar" aria-label="Herramientas del editor">
        <button type="button" title="Título" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={18} />
        </button>
        <button type="button" title="Subtítulo" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={18} />
        </button>
        <button type="button" title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={18} />
        </button>
        <button type="button" title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={18} />
        </button>
        <button type="button" title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={18} />
        </button>
        <button type="button" title="Resaltado" onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={18} />
        </button>
        <button type="button" title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={18} />
        </button>
        <button type="button" title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={18} />
        </button>
        <label className="editor-spacing-control" title="Interlineado">
          <span>Interlineado</span>
          <select
            aria-label="Interlineado"
            value={activeLineSpacing}
            onChange={(event) => {
              if (isRichTextLineSpacing(event.target.value)) setLineSpacing(event.target.value);
            }}
          >
            <option disabled value="">Global</option>
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="wide">Amplio</option>
          </select>
        </label>
        <button type="button" title="Tabla" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={18} />
        </button>
        <button type="button" title="Enlace" onClick={setLink}>
          <LinkIcon size={18} />
        </button>
        <button type="button" title="Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code size={18} />
        </button>
        <button type="button" title="Cita" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={18} />
        </button>
        <button type="button" title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={18} />
        </button>
        {attachmentSupport?.toolbar}
      </div>
      <EditorContent editor={editor} />
      {attachmentSupport?.afterEditor}
    </div>
  );

  if (!attachmentsEnabled) return renderEditor();

  return <RichTextAttachmentSupport editor={editor} owner={owner}>{renderEditor}</RichTextAttachmentSupport>;
}
