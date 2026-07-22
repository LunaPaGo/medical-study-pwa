import { Edit3, Eye, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProcedureWithRelations } from '../../types/procedure';
import { formatDate } from '../topics/topicUtils';
import { getProcedureDisplayName } from './procedureMapper';

type Props = {
  procedure: ProcedureWithRelations;
  readOnly?: boolean;
  onDelete: (procedure: ProcedureWithRelations) => void;
  onToggleFavorite: (procedure: ProcedureWithRelations) => void;
};

export function ProcedureCard({ procedure, readOnly = false, onDelete, onToggleFavorite }: Props) {
  const procedureTitle = getProcedureDisplayName(procedure);

  return (
    <article className="topic-card procedure-card">
      <div className="topic-card-header">
        <div>
          <span className={`status-pill ${procedure.status}`}>{procedure.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h2>{procedureTitle}</h2>
          {procedure.summary && <p>{procedure.summary}</p>}
        </div>
        <button
          className={`favorite-button ${procedure.is_favorite ? 'active' : ''}`}
          disabled={readOnly}
          type="button"
          title={procedure.is_favorite ? 'Quitar favorito' : 'Marcar favorito'}
          onClick={() => onToggleFavorite(procedure)}
        >
          <Heart size={20} fill="currentColor" />
        </button>
      </div>

      <div className="topic-meta">
        {procedure.category && <span>{procedure.category}</span>}
        <span>Modificado {formatDate(procedure.updated_at)}</span>
      </div>

      <div className="chip-list">
        {procedure.tags.map((tag) => (
          <span className="tag-chip" key={tag.id}>
            {tag.name}
          </span>
        ))}
      </div>

      <div className="card-actions">
        <Link className="ghost-button" to={`/procedimientos/${procedure.id}`}>
          <Eye size={17} />
          Ver
        </Link>
        {readOnly ? (
          <span className="notice warning readonly-inline">Solo lectura</span>
        ) : (
          <>
            <Link className="ghost-button" to={`/procedimientos/${procedure.id}/editar`}>
              <Edit3 size={17} />
              Editar
            </Link>
            <button className="ghost-button danger-action" type="button" onClick={() => onDelete(procedure)}>
              <Trash2 size={17} />
              Eliminar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
