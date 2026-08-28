import type { ClipboardEvent, ChangeEvent, DragEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Image as ImageIcon } from 'lucide-react';
import type { Attachment, AttachmentOwnerType } from '../../types/attachment';
import { useAuth } from '../../hooks/useAuth';
import {
  getAttachmentDisplayUrl,
  isImageAttachment,
  linkAttachmentToMedication,
  linkAttachmentToProcedure,
  linkAttachmentToTopic
} from '../attachments/attachmentRepository';
import { useAttachmentMutations, useAttachments } from '../attachments/useAttachments';

type Owner = { ownerType: AttachmentOwnerType; ownerId: string };
export type RichTextAttachmentRenderState = {
  containerClassName: string;
  containerEvents: {
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
    onPaste: (event: ClipboardEvent<HTMLDivElement>) => void;
  };
  inputs: ReactNode;
  toolbar: ReactNode;
  afterEditor: ReactNode;
};

export function RichTextAttachmentSupport({ editor, owner, children }: { editor: Editor; owner?: Owner; children: (support: RichTextAttachmentRenderState) => ReactNode }) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { data: attachments = [] } = useAttachments();
  const attachmentMutations = useAttachmentMutations();
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const insertAttachmentImage = async (attachment: Attachment, options: { linkOwner?: boolean } = {}) => {
    if (!isImageAttachment(attachment)) return;
    if (options.linkOwner ?? true) {
      if (owner?.ownerType === 'topic' && user?.id) await linkAttachmentToTopic(user.id, owner.ownerId, attachment.id);
      if (owner?.ownerType === 'medication' && user?.id) await linkAttachmentToMedication(user.id, owner.ownerId, attachment.id);
      if (owner?.ownerType === 'procedure' && user?.id) await linkAttachmentToProcedure(user.id, owner.ownerId, attachment.id);
    }
    const displayUrl = await getAttachmentDisplayUrl(attachment).catch(() => '');
    editor.chain().focus().insertContent({ type: 'medicalImage', attrs: { attachmentId: attachment.id, src: displayUrl, alt: attachment.filename, title: attachment.filename, align: 'center', width: '100%', caption: '' } }).run();
  };

  const uploadAndInsertImage = async (file: File) => {
    const attachment = await attachmentMutations.upload.mutateAsync({ file, owner });
    await insertAttachmentImage(attachment, { linkOwner: false });
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) uploadAndInsertImage(file).catch(() => undefined);
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

  return children({
    containerClassName: isDraggingImage ? 'dragging' : '',
    containerEvents: {
      onDragOver(event) {
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith('image/'))) {
          event.preventDefault();
          setIsDraggingImage(true);
        }
      },
      onDragLeave: () => setIsDraggingImage(false),
      onDrop: handleDrop,
      onPaste: handlePaste
    },
    inputs: <><input ref={imageInputRef} hidden accept="image/*" type="file" onChange={uploadImage} /><input ref={cameraInputRef} hidden accept="image/*" capture="environment" type="file" onChange={uploadImage} /></>,
    toolbar: <><button className="editor-text-button" type="button" title="Agregar imagen" onClick={() => imageInputRef.current?.click()}><ImageIcon size={18} />Agregar imagen</button><button className="editor-text-button" type="button" title="Tomar foto" onClick={() => cameraInputRef.current?.click()}><ImageIcon size={18} />Cámara</button><button className="editor-text-button" type="button" title="Elegir de biblioteca" onClick={() => setShowLibrary(true)}><ImageIcon size={18} />Biblioteca</button></>,
    afterEditor: <>{isDraggingImage && <div className="editor-drop-hint">Soltá la imagen para insertarla en el tema</div>}{showLibrary && <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="preview-modal image-library-modal"><div className="preview-header"><div><strong>Elegir imagen de la biblioteca</strong><span>Se insertará en la posición actual del editor.</span></div><button className="ghost-button" type="button" onClick={() => setShowLibrary(false)}>Cerrar</button></div><div className="image-library-grid">{attachments.filter(isImageAttachment).map((attachment) => <button key={attachment.id} className="library-image-option" type="button" onClick={() => { insertAttachmentImage(attachment).then(() => setShowLibrary(false)).catch(() => undefined); }}><span>{attachment.filename}</span></button>)}{attachments.filter(isImageAttachment).length === 0 && <p className="empty-state">Todavía no hay imágenes en la biblioteca.</p>}</div></section></div>}</>
  });
}
