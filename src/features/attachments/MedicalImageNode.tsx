import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight, ExternalLink, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAttachmentById, getAttachmentDisplayUrl } from './attachmentRepository';

function MedicalImageView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const attrs = node.attrs as {
    attachmentId?: string;
    src?: string;
    alt?: string;
    title?: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    caption?: string;
  };
  const [src, setSrc] = useState(attrs.src ?? '');
  const align = attrs.align ?? 'center';
  const width = attrs.width ?? '100%';
  const caption = attrs.caption ?? '';

  useEffect(() => {
    let objectUrl = '';
    if (!attrs.attachmentId) return;

    getAttachmentById(attrs.attachmentId)
      .then((attachment) => {
        if (!attachment) return undefined;
        return getAttachmentDisplayUrl(attachment);
      })
      .then((displayUrl) => {
        if (displayUrl) {
          objectUrl = displayUrl.startsWith('blob:') ? displayUrl : '';
          setSrc(displayUrl);
        }
      })
      .catch(() => undefined);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attrs.attachmentId, attrs.title]);

  const setCaption = () => {
    const nextCaption = window.prompt('Pie de imagen', caption);
    if (nextCaption !== null) {
      updateAttributes({ caption: nextCaption });
    }
  };

  const setWidth = () => {
    const nextWidth = window.prompt('Ancho de imagen', width);
    if (nextWidth) {
      updateAttributes({ width: nextWidth });
    }
  };

  const openLarge = () => {
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  };

  return (
    <NodeViewWrapper as="figure" className={`medical-image-figure align-${align}`} data-attachment-id={attrs.attachmentId}>
      {src ? <img src={src} alt={attrs.alt ?? ''} title={attrs.title ?? ''} style={{ width }} /> : <div className="medical-image-loading">Imagen pendiente</div>}
      {caption && <figcaption>{caption}</figcaption>}
      {editor.isEditable && (
        <div className="medical-image-controls" contentEditable={false}>
          <button type="button" title="Izquierda" onClick={() => updateAttributes({ align: 'left' })}>
            <AlignLeft size={15} />
          </button>
          <button type="button" title="Centro" onClick={() => updateAttributes({ align: 'center' })}>
            <AlignCenter size={15} />
          </button>
          <button type="button" title="Derecha" onClick={() => updateAttributes({ align: 'right' })}>
            <AlignRight size={15} />
          </button>
          <button type="button" onClick={setWidth}>
            Tamaño
          </button>
          <button type="button" onClick={setCaption}>
            Pie
          </button>
          <button type="button" title="Abrir" onClick={openLarge}>
            <ExternalLink size={15} />
          </button>
          <button type="button" title="Quitar del documento" onClick={deleteNode}>
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const MedicalImageNode = Node.create({
  name: 'medicalImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: null },
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      align: { default: 'center' },
      width: { default: '100%' },
      caption: { default: '' }
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-attachment-id]' }, { tag: 'img[data-attachment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes({
        'data-attachment-id': HTMLAttributes.attachmentId,
        class: `medical-image-figure align-${HTMLAttributes.align ?? 'center'}`
      }),
      ['img', mergeAttributes(HTMLAttributes, { class: 'medical-image-node' })],
      HTMLAttributes.caption ? ['figcaption', HTMLAttributes.caption] : ['figcaption']
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MedicalImageView);
  }
});
