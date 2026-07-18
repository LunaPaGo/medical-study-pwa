import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Edit3, FileDown, Heart, Trash2 } from 'lucide-react';
import { useWordExport } from '../features/export/useWordExport';
import { ProcedureAttachmentsPanel } from '../features/procedures/ProcedureAttachmentsPanel';
import { procedureStudySections } from '../features/procedures/procedureSectionCatalog';
import { RichTextSectionPanel } from '../features/studySections/RichTextSectionPanel';
import { formatDate } from '../features/topics/topicUtils';
import { isEmptyTipTapDocument } from '../features/topics/tiptapDocument';
import { useProcedureData, useProcedureMutations } from '../features/procedures/useProcedureData';
import { useAuth } from '../hooks/useAuth';

export function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProcedureData();
  const mutations = useProcedureMutations();
  const { isReadOnly } = useAuth();
  const procedure = data?.procedures.find((item) => item.id === procedureId);
  const wordExport = useWordExport('procedure', procedureId);

  if (!isLoading && !procedure) {
    return <Navigate to="/procedimientos" replace />;
  }

  if (!procedure) {
    return <div className="panel empty-state">Cargando procedimiento...</div>;
  }

  const visibleSections = procedureStudySections.filter((section) => !isEmptyTipTapDocument(procedure[section.jsonField]));

  const remove = () => {
    if (window.confirm(`¿Eliminar "${procedure.name}"?`)) {
      mutations.deleteProcedure.mutate(procedure.id, { onSuccess: () => navigate('/procedimientos') });
    }
  };

  return (
    <article className="reader-page procedure-reader">
      <div className="reader-header">
        <div>
          <span className={`status-pill ${procedure.status}`}>{procedure.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h1>{procedure.name}</h1>
          {procedure.summary && <p>{procedure.summary}</p>}
        </div>
        <div className="heading-actions">
          <button className={`ghost-button ${procedure.is_favorite ? 'favorite-active' : ''}`} type="button" disabled={isReadOnly} onClick={() => mutations.toggleFavorite.mutate(procedure)}>
            <Heart size={18} fill="currentColor" />
            Favorito
          </button>
          <button className="ghost-button" type="button" disabled={wordExport.isExporting} onClick={wordExport.exportToWord}>
            <FileDown size={18} />
            {wordExport.isExporting ? 'Exportando...' : 'Exportar a Word'}
          </button>
          {isReadOnly ? (
            <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>
          ) : (
            <>
              <Link className="ghost-button" to={`/procedimientos/${procedure.id}/editar`}>
                <Edit3 size={18} />
                Editar
              </Link>
              <button className="ghost-button danger-action" type="button" onClick={remove}>
                <Trash2 size={18} />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {wordExport.message && <div className="notice success">{wordExport.message}</div>}
      {wordExport.error && <div className="notice error">{wordExport.error}</div>}

      <div className="topic-meta reader-meta">
        {procedure.category && <span>{procedure.category}</span>}
        <span>Creado {formatDate(procedure.created_at)}</span>
        <span>Modificado {formatDate(procedure.updated_at)}</span>
      </div>

      <div className="chip-list">
        {procedure.tags.map((tag) => (
          <span className="tag-chip" key={tag.id}>
            {tag.name}
          </span>
        ))}
      </div>

      {visibleSections.length > 0 ? (
        <div className="rich-section-stack">
          {visibleSections.map((section) => (
            <RichTextSectionPanel
              key={section.key}
              storageKey={`procedure-read-section-state:${procedure.id}`}
              sectionKey={section.key}
              title={section.title}
              mode="read"
              value={procedure[section.jsonField]}
            />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">El procedimiento todavía no tiene secciones cargadas.</div>
      )}

      <ProcedureAttachmentsPanel procedureId={procedure.id} attached={procedure.attachments} readOnly={isReadOnly} />
    </article>
  );
}
