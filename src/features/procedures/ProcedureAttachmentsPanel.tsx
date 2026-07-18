import { useEffect, useMemo, useState } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import type { Attachment } from '../../types/attachment';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { FileDropzone } from '../attachments/FileDropzone';
import { unlinkAttachmentFromProcedure } from '../attachments/attachmentRepository';
import { useAttachments } from '../attachments/useAttachments';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  procedureId: string;
  attached: Attachment[];
  readOnly?: boolean;
  onChanged?: () => void;
};

export function ProcedureAttachmentsPanel({ procedureId, attached, readOnly = false, onChanged }: Props) {
  const { user } = useAuth();
  const { data: library = [] } = useAttachments();
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [linkedIds, setLinkedIds] = useState(() => attached.map((attachment) => attachment.id));
  const [error, setError] = useState('');

  useEffect(() => {
    setLinkedIds(attached.map((attachment) => attachment.id));
  }, [attached]);

  const linkedAttachments = useMemo(() => {
    const byId = new Map([...attached, ...library].map((attachment) => [attachment.id, attachment]));
    return linkedIds.map((id) => byId.get(id)).filter(Boolean) as Attachment[];
  }, [attached, library, linkedIds]);

  const unlink = async (attachment: Attachment) => {
    if (!user?.id || readOnly) return;
    if (!window.confirm(`¿Quitar "${attachment.filename}" de este procedimiento? El archivo seguirá existiendo en Archivos.`)) return;

    try {
      setError('');
      await unlinkAttachmentFromProcedure(user.id, procedureId, attachment.id);
      setLinkedIds((current) => current.filter((id) => id !== attachment.id));
      onChanged?.();
    } catch {
      setError('No se pudo quitar el vínculo del archivo. Intentá nuevamente.');
    }
  };

  return (
    <section className="panel medication-attachments-panel procedure-attachments-panel">
      <div className="panel-title medication-panel-title">
        <h2>Archivos e imágenes</h2>
      </div>

      {readOnly ? (
        <div className="notice warning">Modo sin conexión: los adjuntos están disponibles solo para consulta.</div>
      ) : (
        <FileDropzone
          owner={{ ownerType: 'procedure', ownerId: procedureId }}
          compact
          onUploaded={(attachmentId) => {
            setLinkedIds((current) => (current.includes(attachmentId) ? current : [...current, attachmentId]));
            onChanged?.();
          }}
        />
      )}

      {error && <div className="notice error">{error}</div>}

      <div className="medication-attachment-grid">
        {linkedAttachments.map((attachment) => (
          <div key={attachment.id} className="attachment-preview-button medication-inline-attachment">
            <button type="button" onClick={() => setPreview(attachment)}>
              <Paperclip size={16} />
              <span>{attachment.filename}</span>
            </button>
            {!readOnly && (
              <button className="ghost-button icon-button danger-action" type="button" title="Quitar vínculo" onClick={() => unlink(attachment)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {linkedAttachments.length === 0 && <p className="empty-state">Todavía no hay archivos asociados a este procedimiento.</p>}
      {preview && <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
