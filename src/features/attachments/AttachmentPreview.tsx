import { useEffect, useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import type { Attachment } from '../../types/attachment';
import { getAttachmentFile, getSignedAttachmentUrl, isImageAttachment } from './attachmentRepository';

type Props = {
  attachment: Attachment;
  onClose: () => void;
};

export function AttachmentPreview({ attachment, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let objectUrl = '';

    getAttachmentFile(attachment.id)
      .then((pending) => {
        if (pending) {
          objectUrl = URL.createObjectURL(pending.file);
          setUrl(objectUrl);
          return;
        }
        return getSignedAttachmentUrl(attachment).then(setUrl);
      })
      .catch(() => setUrl(''));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="preview-modal">
        <div className="preview-header">
          <div>
            <strong>{attachment.filename}</strong>
            <span>{attachment.mime_type}</span>
          </div>
          <button className="ghost-button icon-button" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="preview-body">
          {isImageAttachment(attachment) && url ? (
            <img src={url} alt={attachment.filename} style={{ transform: `scale(${zoom})` }} />
          ) : (
            <div className="file-preview-placeholder">
              <ExternalLink size={38} />
              <p>Vista previa no disponible para este tipo de archivo.</p>
            </div>
          )}
        </div>

        <div className="preview-actions">
          {isImageAttachment(attachment) && (
            <>
              <button className="ghost-button" type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>
                Alejar
              </button>
              <button className="ghost-button" type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>
                Acercar
              </button>
            </>
          )}
          {url && (
            <a className="primary-button" href={url} download={attachment.original_filename}>
              <Download size={18} />
              Descargar
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
