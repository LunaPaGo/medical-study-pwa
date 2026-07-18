import { ChangeEvent, DragEvent, ClipboardEvent, useEffect, useRef, useState } from 'react';
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
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Underline as UnderlineIcon
} from 'lucide-react';
import type { Attachment, AttachmentOwnerType } from '../../types/attachment';
import type { TipTapDocument } from '../../types/topic';
import { MedicalImageNode } from '../attachments/MedicalImageNode';
import {
  getAttachmentDisplayUrl,
  isImageAttachment,
  linkAttachmentToMedication,
  linkAttachmentToProcedure,
  linkAttachmentToTopic
} from '../attachments/attachmentRepository';
import { useAuth } from '../../hooks/useAuth';
import { useAttachmentMutations, useAttachments } from '../attachments/useAttachments';

type Props = {
  value: TipTapDocument;
  onChange: (value: { json: TipTapDocument; html: string }) => void;
  owner?: { ownerType: AttachmentOwnerType; ownerId: string };
};

export function RichTextEditor({ value, onChange, owner }: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { data: attachments = [] } = useAttachments();
  const attachmentMutations = useAttachmentMutations();
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
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
      MedicalImageNode
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor-content'
      }
    },
    onUpdate({ editor: activeEditor }) {
      onChange({
        json: activeEditor.getJSON() as TipTapDocument,
        html: activeEditor.getHTML()
      });
    }
  });

  useEffect(() => {
    if (!editor) return;

    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (current !== next) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  const insertAttachmentImage = async (attachment: Attachment) => {
    if (!isImageAttachment(attachment)) return;
    if (owner?.ownerType === 'topic' && user?.id) {
      await linkAttachmentToTopic(user.id, owner.ownerId, attachment.id);
    }
    if (owner?.ownerType === 'medication' && user?.id) {
      await linkAttachmentToMedication(user.id, owner.ownerId, attachment.id);
    }
    if (owner?.ownerType === 'procedure' && user?.id) {
      await linkAttachmentToProcedure(user.id, owner.ownerId, attachment.id);
    }
    const displayUrl = await getAttachmentDisplayUrl(attachment).catch(() => '');
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'medicalImage',
        attrs: {
          attachmentId: attachment.id,
          src: displayUrl,
          alt: attachment.filename,
          title: attachment.filename,
          align: 'center',
          width: '100%',
          caption: ''
        }
      })
      .run();
  };

  const uploadAndInsertImage = async (file: File) => {
    const attachment = await attachmentMutations.upload.mutateAsync({ file, owner });
    await insertAttachmentImage(attachment);
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      uploadAndInsertImage(file).catch(() => undefined);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
    if (!imageFile) return;
    event.preventDefault();
    setIsDraggingImage(false);
    uploadAndInsertImage(imageFile).catch(() => undefined);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const imageFile = Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));
    if (!imageFile) return;
    event.preventDefault();
    uploadAndInsertImage(imageFile).catch(() => undefined);
  };

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

  const insertImagePlaceholder = () => {
    imageInputRef.current?.click();
  };

  return (
    <div
      className={`rich-editor ${isDraggingImage ? 'dragging' : ''}`}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith('image/'))) {
          event.preventDefault();
          setIsDraggingImage(true);
        }
      }}
      onDragLeave={() => setIsDraggingImage(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input ref={imageInputRef} hidden accept="image/*" type="file" onChange={uploadImage} />
      <input ref={cameraInputRef} hidden accept="image/*" capture="environment" type="file" onChange={uploadImage} />
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
        <button className="editor-text-button" type="button" title="Agregar imagen" onClick={insertImagePlaceholder}>
          <ImageIcon size={18} />
          Agregar imagen
        </button>
        <button className="editor-text-button" type="button" title="Tomar foto" onClick={() => cameraInputRef.current?.click()}>
          <ImageIcon size={18} />
          Cámara
        </button>
        <button className="editor-text-button" type="button" title="Elegir de biblioteca" onClick={() => setShowLibrary(true)}>
          <ImageIcon size={18} />
          Biblioteca
        </button>
      </div>
      <EditorContent editor={editor} />
      {isDraggingImage && <div className="editor-drop-hint">Soltá la imagen para insertarla en el tema</div>}
      {showLibrary && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="preview-modal image-library-modal">
            <div className="preview-header">
              <div>
                <strong>Elegir imagen de la biblioteca</strong>
                <span>Se insertará en la posición actual del editor.</span>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowLibrary(false)}>
                Cerrar
              </button>
            </div>
            <div className="image-library-grid">
              {attachments.filter(isImageAttachment).map((attachment) => (
                <button
                  key={attachment.id}
                  className="library-image-option"
                  type="button"
                  onClick={() => {
                    insertAttachmentImage(attachment)
                      .then(() => setShowLibrary(false))
                      .catch(() => undefined);
                  }}
                >
                  <span>{attachment.filename}</span>
                </button>
              ))}
              {attachments.filter(isImageAttachment).length === 0 && <p className="empty-state">Todavía no hay imágenes en la biblioteca.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
