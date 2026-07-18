import { Copy, Download, Edit3, Eye, File, Image as ImageIcon, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Attachment } from '../../types/attachment';
import {
  attachmentToInternalLink,
  getAttachmentFile,
  getAttachmentOwnerSummaries,
  getAttachmentUsageSummary,
  getSignedAttachmentUrl,
  isImageAttachment,
  type AttachmentOwnerSummary
} from './attachmentRepository';

type Props = {
  attachment: Attachment;
  viewMode: 'grid' | 'list';
  onPreview: (attachment: Attachment) => void;
  onRename: (attachment: Attachment) => void;
  onRemove: (attachment: Attachment) => void;
  readOnly?: boolean;
};

export function AttachmentCard({ attachment, viewMode, onPreview, onRename, onRemove, readOnly = false }: Props) {
  const [thumbUrl, setThumbUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [owners, setOwners] = useState<AttachmentOwnerSummary[]>([]);

  useEffect(() => {
    let objectUrl = '';
    let thumbObjectUrl = '';

    getAttachmentFile(attachment.id)
      .then((pending) => {
        if (pending?.thumbnail) {
          thumbObjectUrl = URL.createObjectURL(pending.thumbnail);
          setThumbUrl(thumbObjectUrl);
        } else if (pending?.file && isImageAttachment(attachment)) {
          objectUrl = URL.createObjectURL(pending.file);
          setThumbUrl(objectUrl);
        } else if (attachment.thumbnail_path || isImageAttachment(attachment)) {
          getSignedAttachmentUrl(attachment, Boolean(attachment.thumbnail_path)).then(setThumbUrl).catch(() => setThumbUrl(''));
        }

        if (pending?.file) {
          const localDownload = URL.createObjectURL(pending.file);
          setDownloadUrl(localDownload);
        } else {
          getSignedAttachmentUrl(attachment).then(setDownloadUrl).catch(() => setDownloadUrl(''));
        }
      })
      .catch(() => undefined);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (thumbObjectUrl) URL.revokeObjectURL(thumbObjectUrl);
    };
  }, [attachment]);

  useEffect(() => {
    let active = true;
    getAttachmentUsageSummary(attachment.user_id, attachment.id)
      .then((summary) => {
        if (active) setUsageCount(summary.total);
      })
      .catch(() => {
        if (active) setUsageCount(0);
      });

    return () => {
      active = false;
    };
  }, [attachment.id, attachment.user_id]);

  useEffect(() => {
    let active = true;
    getAttachmentOwnerSummaries(attachment.user_id, attachment.id)
      .then((items) => {
        if (active) setOwners(items);
      })
      .catch(() => {
        if (active) setOwners([]);
      });

    return () => {
      active = false;
    };
  }, [attachment.id, attachment.user_id]);

  const copyInternalLink = async () => {
    await navigator.clipboard.writeText(await attachmentToInternalLink(attachment));
  };

  return (
    <article className={`attachment-card ${viewMode}`}>
      <button className="attachment-preview-button" type="button" onClick={() => onPreview(attachment)}>
        {isImageAttachment(attachment) && thumbUrl ? <img src={thumbUrl} alt={attachment.filename} /> : isImageAttachment(attachment) ? <ImageIcon size={34} /> : <File size={34} />}
      </button>
      <div className="attachment-info">
        <strong>{attachment.filename}</strong>
        <span>{attachment.mime_type || 'archivo'} · {(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
        <span>Fecha: {new Date(attachment.created_at).toLocaleDateString('es')}</span>
        <span>{usageCount === 1 ? 'Asociado a 1 elemento' : `Asociado a ${usageCount} elementos`}</span>
        {owners.length > 0 && (
          <div className="chip-list">
            {owners.map((owner) => (
              <Link className="tag-chip" key={`${owner.ownerType}-${owner.ownerId}`} to={owner.href}>
                {owner.ownerType === 'topic' && 'Tema: '}
                {owner.ownerType === 'medication' && 'Fármaco: '}
                {owner.ownerType === 'procedure' && 'Procedimiento: '}
                {owner.label}
              </Link>
            ))}
          </div>
        )}
        {attachment.sync_status && attachment.sync_status !== 'synced' && (
          <span className={`status-pill ${attachment.sync_status === 'error' ? '' : 'complete'}`}>
            {attachment.sync_status === 'pending' && 'Pendiente de sincronización'}
            {attachment.sync_status === 'uploading' && 'Subiendo'}
            {attachment.sync_status === 'error' && 'Error, se reintentará'}
          </span>
        )}
      </div>
      <div className="card-actions">
        <button className="ghost-button" type="button" onClick={() => onPreview(attachment)}>
          <Eye size={17} />
          Ver
        </button>
        {!readOnly && (
          <button className="ghost-button" type="button" onClick={() => onRename(attachment)}>
            <Edit3 size={17} />
            Renombrar
          </button>
        )}
        <button className="ghost-button" type="button" onClick={copyInternalLink}>
          <Copy size={17} />
          Copiar enlace
        </button>
        {downloadUrl && (
          <a className="ghost-button" href={downloadUrl} download={attachment.original_filename}>
            <Download size={17} />
            Descargar
          </a>
        )}
        {attachment.sync_status === 'error' && (
          <span className="ghost-button">
            <RefreshCcw size={17} />
            Reintento automático
          </span>
        )}
        {readOnly ? (
          <span className="notice warning readonly-inline">Solo lectura</span>
        ) : (
          <button className="ghost-button danger-action" type="button" onClick={() => onRemove(attachment)}>
            <Trash2 size={17} />
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}
