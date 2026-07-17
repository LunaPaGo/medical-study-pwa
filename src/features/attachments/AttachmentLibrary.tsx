import { useMemo, useState } from 'react';
import { Grid2X2, List, Search } from 'lucide-react';
import type { Attachment, AttachmentViewMode } from '../../types/attachment';
import { useAuth } from '../../hooks/useAuth';
import { getAttachmentUsageCount } from './attachmentRepository';
import { AttachmentCard } from './AttachmentCard';
import { AttachmentPreview } from './AttachmentPreview';
import { FileDropzone } from './FileDropzone';
import { useAttachmentMutations, useAttachments } from './useAttachments';

export function AttachmentLibrary() {
  const { data = [], isLoading } = useAttachments();
  const mutations = useAttachmentMutations();
  const { isReadOnly } = useAuth();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<AttachmentViewMode>('grid');
  const [preview, setPreview] = useState<Attachment | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.filter((item) =>
      [item.filename, item.original_filename, item.mime_type].join(' ').toLowerCase().includes(needle)
    );
  }, [data, query]);

  const rename = (attachment: Attachment) => {
    const nextName = window.prompt('Nuevo nombre del archivo', attachment.filename);
    if (!nextName?.trim()) return;
    mutations.rename.mutate({ attachment, filename: nextName });
  };

  const remove = async (attachment: Attachment) => {
    const usageCount = await getAttachmentUsageCount(attachment.user_id, attachment.id);
    if (usageCount > 0) {
      window.alert(`Este archivo está asociado a ${usageCount} tema(s). Quitalo primero del contenido del tema para evitar referencias rotas.`);
      return;
    }
    if (!window.confirm(`¿Eliminar "${attachment.filename}"?`)) return;
    mutations.remove.mutate(attachment);
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Etapa 3</span>
          <h1>Archivos e imágenes</h1>
          <p>Biblioteca reutilizable para adjuntos de temas, farmacología y futuras secciones.</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button icon-button" type="button" onClick={() => setViewMode('grid')} title="Galería">
            <Grid2X2 size={18} />
          </button>
          <button className="ghost-button icon-button" type="button" onClick={() => setViewMode('list')} title="Lista">
            <List size={18} />
          </button>
        </div>
      </div>

      {isReadOnly ? <div className="notice warning">Modo sin conexión: solo podés consultar archivos ya disponibles en este dispositivo.</div> : <FileDropzone />}

      <section className="panel filter-panel attachment-filter">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o tipo de archivo" />
      </section>

      {isLoading && <div className="panel empty-state">Cargando archivos...</div>}

      <div className={`attachment-list ${viewMode}`}>
        {filtered.map((attachment) => (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
            viewMode={viewMode}
            onPreview={setPreview}
            onRename={rename}
            onRemove={remove}
            readOnly={isReadOnly}
          />
        ))}
      </div>

      {!isLoading && filtered.length === 0 && <div className="panel empty-state">Todavía no hay archivos con estos filtros.</div>}
      {preview && <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
