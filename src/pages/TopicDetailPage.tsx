import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Copy, Edit3, FileDown, Heart, Trash2 } from 'lucide-react';
import { useWordExport } from '../features/export/useWordExport';
import { RichTextSectionPanel } from '../features/studySections/RichTextSectionPanel';
import { TopicRelationsPanel } from '../features/topics/TopicRelationsPanel';
import { topicSections } from '../features/topics/topicSectionCatalog';
import { formatDate } from '../features/topics/topicUtils';
import { isEmptyTipTapDocument } from '../features/topics/tiptapDocument';
import { useTopicData, useTopicMutations } from '../features/topics/useTopicData';
import { useAuth } from '../hooks/useAuth';

export function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTopicData();
  const mutations = useTopicMutations();
  const { isReadOnly } = useAuth();
  const topic = data?.topics.find((item) => item.id === topicId);
  const wordExport = useWordExport('topic', topicId);

  if (!isLoading && !topic) {
    return <Navigate to="/temas" replace />;
  }

  if (!topic) {
    return <div className="panel empty-state">Cargando tema...</div>;
  }

  const remove = () => {
    if (window.confirm(`¿Eliminar "${topic.title}"?`)) {
      mutations.deleteTopic.mutate(topic.id, { onSuccess: () => navigate('/temas') });
    }
  };
  const visibleSections = topicSections.filter((section) => !isEmptyTipTapDocument(topic[section.jsonField]));

  return (
    <article className="reader-page">
      <div className="reader-header">
        <div>
          <span className={`status-pill ${topic.status}`}>{topic.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h1>{topic.title}</h1>
          {topic.subtitle && <p>{topic.subtitle}</p>}
        </div>
        <div className="heading-actions">
          <button className={`ghost-button ${topic.is_favorite ? 'favorite-active' : ''}`} type="button" disabled={isReadOnly} onClick={() => mutations.toggleFavorite.mutate(topic)}>
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
              <Link className="ghost-button" to={`/temas/${topic.id}/editar`}>
                <Edit3 size={18} />
                Editar
              </Link>
              <button className="ghost-button" type="button" onClick={() => mutations.duplicateTopic.mutate(topic)}>
                <Copy size={18} />
                Duplicar
              </button>
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
        {topic.folder && <span>{topic.folder.name}</span>}
        {topic.category && <span>{topic.category.name}</span>}
        {topic.specialty && <span>{topic.specialty}</span>}
        <span>Creado {formatDate(topic.created_at)}</span>
        <span>Modificado {formatDate(topic.updated_at)}</span>
      </div>

      <div className="chip-list">
        {topic.tags.map((tag) => (
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
              storageKey={`topic-read-section-state:${topic.id}`}
              sectionKey={section.key}
              title={section.title}
              mode="read"
              value={topic[section.jsonField]}
            />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">El tema todavía no tiene secciones cargadas.</div>
      )}

      <TopicRelationsPanel
        topic={topic}
        topics={data?.topics ?? []}
        readOnly={isReadOnly}
        isSaving={mutations.createTopicRelation.isPending || mutations.deleteTopicRelation.isPending}
        onCreate={({ targetTopicId, relationType }) => mutations.createTopicRelation.mutate({ sourceTopicId: topic.id, targetTopicId, relationType })}
        onDelete={(relationId) => mutations.deleteTopicRelation.mutate(relationId)}
      />
    </article>
  );
}
