import { Copy, Edit3, Eye, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicWithRelations } from '../../types/topic';
import { formatDate, stripHtml } from './topicUtils';

type Props = {
  topic: TopicWithRelations;
  onDelete: (topic: TopicWithRelations) => void;
  onDuplicate: (topic: TopicWithRelations) => void;
  onToggleFavorite: (topic: TopicWithRelations) => void;
};

export function TopicCard({ topic, onDelete, onDuplicate, onToggleFavorite }: Props) {
  const summary = stripHtml(topic.content_html);

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
      </div>
    </article>
  );
}
