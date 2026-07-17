import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Trash2 } from 'lucide-react';
import type { TopicRelationType, TopicWithRelations } from '../../types/topic';
import { getTopicRelationLabel, topicRelationLabels, topicRelationTypes } from './topicRelationCatalog';

type Props = {
  topic: TopicWithRelations;
  topics: TopicWithRelations[];
  readOnly: boolean;
  onCreate: (values: { targetTopicId: string; relationType: TopicRelationType }) => void;
  onDelete: (relationId: string) => void;
  isSaving?: boolean;
};

export function TopicRelationsPanel({ topic, topics, readOnly, onCreate, onDelete, isSaving }: Props) {
  const [search, setSearch] = useState('');
  const [targetTopicId, setTargetTopicId] = useState('');
  const [relationType, setRelationType] = useState<TopicRelationType>('related');
  const [error, setError] = useState('');

  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return topics
      .filter((item) => item.id !== topic.id)
      .filter((item) => !needle || item.title.toLowerCase().includes(needle))
      .sort((a, b) => a.title.localeCompare(b.title, 'es'))
      .slice(0, 8);
  }, [search, topic.id, topics]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!targetTopicId) {
      setError('Elegí un tema para relacionar.');
      return;
    }
    onCreate({ targetTopicId, relationType });
    setTargetTopicId('');
    setSearch('');
  };

  return (
    <section className="panel topic-relations-panel">
      <div className="panel-title">
        <Link2 size={20} aria-hidden="true" />
        <h2>Temas relacionados</h2>
      </div>

      {topic.relatedTopics.length > 0 ? (
        <div className="topic-relation-list">
          {topic.relatedTopics.map((relation) => (
            <div className="topic-relation-item" key={relation.id}>
              <div>
                <span>{getTopicRelationLabel(relation.relation_type, relation.direction)}</span>
                <Link to={`/temas/${relation.relatedTopic.id}`}>{relation.relatedTopic.title}</Link>
              </div>
              {!readOnly && (
                <button className="icon-button ghost-button danger-action" type="button" aria-label="Eliminar relación" onClick={() => onDelete(relation.id)}>
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Todavía no hay temas relacionados.</p>
      )}

      {readOnly ? (
        <div className="notice warning">Modo sin conexión: las relaciones están disponibles solo para lectura.</div>
      ) : (
        <form className="topic-relation-form" onSubmit={submit}>
          <label>
            Buscar tema
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título" />
          </label>
          <label>
            Tipo
            <select value={relationType} onChange={(event) => setRelationType(event.target.value as TopicRelationType)}>
              {topicRelationTypes.map((type) => (
                <option key={type} value={type}>
                  {topicRelationLabels[type].direct}
                </option>
              ))}
            </select>
          </label>
          <div className="topic-relation-results">
            {candidates.map((candidate) => (
              <button
                className={candidate.id === targetTopicId ? 'ghost-button relation-selected' : 'ghost-button'}
                key={candidate.id}
                type="button"
                onClick={() => setTargetTopicId(candidate.id)}
              >
                {candidate.title}
              </button>
            ))}
            {search && candidates.length === 0 && <span className="empty-state">No se encontraron temas.</span>}
          </div>
          {error && <div className="notice error">{error}</div>}
          <button className="primary-button" type="submit" disabled={isSaving || !targetTopicId}>
            <Link2 size={18} aria-hidden="true" />
            Vincular tema
          </button>
        </form>
      )}
    </section>
  );
}
