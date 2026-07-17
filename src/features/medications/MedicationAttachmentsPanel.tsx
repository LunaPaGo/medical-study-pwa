import { useState } from 'react';
import { ImagePlus, Link2 } from 'lucide-react';
import type { Attachment } from '../../types/attachment';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { FileDropzone } from '../attachments/FileDropzone';
import { isImageAttachment, linkAttachmentToMedication } from '../attachments/attachmentRepository';
import { useAttachments } from '../attachments/useAttachments';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  medicationId: string;
  attached: Attachment[];
  readOnly?: boolean;
  onChanged?: () => void;
};

export function MedicationAttachmentsPanel({ medicationId, attached, readOnly = false, onChanged }: Props) {
  const { user } = useAuth();
  const { data: library = [] } = useAttachments();
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const attachedIds = new Set(attached.map((attachment) => attachment.id));
  const available = library.filter((attachment) => !attachedIds.has(attachment.id));

  const linkExisting = async (attachment: Attachment) => {
    if (!user?.id) return;
    await linkAttachmentToMedication(user.id, medicationId, attachment.id);
    onChanged?.();
    setShowLibrary(false);
  };

  return (
    <section className="panel medication-attachments-panel">
      <div className="panel-title medication-panel-title">
        <h2>Archivos e imágenes</h2>
        {!readOnly && (
          <button className="ghost-button" type="button" onClick={() => setShowLibrary((value) => !value)}>
            <ImagePlus size={18} />
            Elegir de biblioteca
          </button>
        )}
      </div>

      {readOnly ? (
        <div className="notice warning">Modo sin conexión: los adjuntos están disponibles solo para consulta.</div>
      ) : (
        <FileDropzone owner={{ ownerType: 'medication', ownerId: medicationId }} compact onUploaded={onChanged} />
      )}

      {showLibrary && (
        <div className="medication-library-list">
          {available.map((attachment) => (
            <button className="ghost-button" key={attachment.id} type="button" onClick={() => linkExisting(attachment)}>
              <Link2 size={16} />
              {attachment.filename}
            </button>
          ))}
          {available.length === 0 && <p className="empty-state">No hay archivos libres para asociar.</p>}
        </div>
      )}

      <div className="medication-attachment-grid">
        {attached.map((attachment) => (
          <button key={attachment.id} className="attachment-preview-button medication-inline-attachment" type="button" onClick={() => setPreview(attachment)}>
            {isImageAttachment(attachment) ? <span>{attachment.filename}</span> : <span>{attachment.filename}</span>}
          </button>
        ))}
      </div>

      {attached.length === 0 && <p className="empty-state">Todavía no hay archivos asociados a este medicamento.</p>}
      {preview && <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
