import { Copy, Edit3, Eye, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicWithRelations } from '../../types/topic';
import type { StudyListViewMode } from '../theme/useStudyListViewPreference';
import { formatDate, stripHtml } from './topicUtils';

type Props = {
  topic: TopicWithRelations;
  readOnly?: boolean;
  viewMode?: StudyListViewMode;
  onDelete: (topic: TopicWithRelations) => void;
  onDuplicate: (topic: TopicWithRelations) => void;
  onToggleFavorite: (topic: TopicWithRelations) => void;
};

export function TopicCard({ topic, readOnly = false, viewMode = 'grid', onDelete, onDuplicate, onToggleFavorite }: Props) {
  const summary = stripHtml(topic.content_html);

  if (viewMode === 'list') {
    return (
      <article className="topic-card topic-card-list">
        <div className="compact-card-main">
          <div className="compact-card-title-row">
            <span className={`status-pill ${topic.status}`}>{topic.status === 'complete' ? 'Completo' : 'Borrador'}</span>
            <h2>{topic.title}</h2>
            <span className="compact-updated">Modificado {formatDate(topic.updated_at)}</span>
          </div>
          {topic.subtitle && <p>{topic.subtitle}</p>}
          <div className="compact-card-actions">
            <Link className="ghost-button" to={`/temas/${topic.id}`}>
              Ver
            </Link>
            {!readOnly && (
              <Link className="ghost-button" to={`/temas/${topic.id}/editar`}>
                Editar
              </Link>
            )}
            <button
              className={`ghost-button ${topic.is_favorite ? 'favorite-active' : ''}`}
              disabled={readOnly}
              type="button"
              onClick={() => onToggleFavorite(topic)}
            >
              Favorito
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="topic-card">
      <div className="topic-card-header">
        <div>
          <span className={`status-pill ${topic.status}`}>{topic.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h2>{topic.title}</h2>
          {topic.subtitle && <p>{topic.subtitle}</p>}
        </div>
        <button
          className={`favorite-button ${topic.is_favorite ? 'active' : ''}`}
          disabled={readOnly}
          type="button"
          title={topic.is_favorite ? 'Quitar favorito' : 'Marcar favorito'}
          onClick={() => onToggleFavorite(topic)}
        >
          <Heart size={20} fill="currentColor" />
        </button>
      </div>
      <p className="topic-summary">{summary || 'Sin contenido visible.'}</p>
      <div className="topic-meta">
        {topic.folder && <span>{topic.folder.name}</span>}
        {topic.category && <span>{topic.category.name}</span>}
        {topic.specialty && <span>{topic.specialty}</span>}
        <span>Modificado {formatDate(topic.updated_at)}</span>
      </div>
      <div className="chip-list">
        {topic.tags.map((tag) => (
          <span className="tag-chip" key={tag.id}>
            {tag.name}
          </span>
        ))}
      </div>
      <div className="card-actions">
        <Link className="ghost-button" to={`/temas/${topic.id}`}>
          <Eye size={17} />
          Ver
        </Link>
        {readOnly ? (
          <span className="notice warning readonly-inline">Solo lectura</span>
        ) : (
          <>
            <Link className="ghost-button" to={`/temas/${topic.id}/editar`}>
              <Edit3 size={17} />
              Editar
            </Link>
            <button className="ghost-button" type="button" onClick={() => onDuplicate(topic)}>
              <Copy size={17} />
              Duplicar
            </button>
            <button className="ghost-button danger-action" type="button" onClick={() => onDelete(topic)}>
              <Trash2 size={17} />
              Eliminar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
