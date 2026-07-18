import { Link } from 'react-router-dom';
import { BookOpen, Pill, ClipboardList } from 'lucide-react';
import { useMedicationData, useMedicationMutations } from '../features/medications/useMedicationData';
import { useProcedureData, useProcedureMutations } from '../features/procedures/useProcedureData';
import { useTopicData, useTopicMutations } from '../features/topics/useTopicData';
import { formatDate } from '../features/topics/topicUtils';
import { useAuth } from '../hooks/useAuth';

export function FavoritesPage() {
  const { isReadOnly } = useAuth();
  const { data: topicData, isLoading: loadingTopics } = useTopicData();
  const { data: medicationData, isLoading: loadingMedications } = useMedicationData();
  const { data: procedureData, isLoading: loadingProcedures } = useProcedureData();
  const topicMutations = useTopicMutations();
  const medicationMutations = useMedicationMutations();
  const procedureMutations = useProcedureMutations();

  const topics = (topicData?.topics ?? []).filter((topic) => topic.is_favorite);
  const medications = (medicationData?.medications ?? []).filter((medication) => medication.is_favorite);
  const procedures = (procedureData?.procedures ?? []).filter((procedure) => procedure.is_favorite);
  const isLoading = loadingTopics || loadingMedications || loadingProcedures;
  const isEmpty = topics.length === 0 && medications.length === 0 && procedures.length === 0;

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Favoritos</span>
          <h1>Favoritos</h1>
          <p>Temas, fármacos y procedimientos marcados para volver rápido.</p>
        </div>
        {isReadOnly && <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>}
      </div>

      {isLoading && <div className="panel empty-state">Cargando favoritos...</div>}

      <div className="topic-list">
        {topics.map((topic) => (
          <article className="topic-card" key={`topic-${topic.id}`}>
            <div className="topic-card-header">
              <div>
                <span className="status-pill">Tema</span>
                <h2>{topic.title}</h2>
                {topic.subtitle && <p>{topic.subtitle}</p>}
              </div>
              <BookOpen size={22} />
            </div>
            <div className="topic-meta">
              {topic.category && <span>{topic.category.name}</span>}
              <span>Modificado {formatDate(topic.updated_at)}</span>
            </div>
            <div className="card-actions">
              <Link className="ghost-button" to={`/temas/${topic.id}`}>
                Abrir tema
              </Link>
              <button className="ghost-button" type="button" disabled={isReadOnly} onClick={() => topicMutations.toggleFavorite.mutate(topic)}>
                Quitar favorito
              </button>
            </div>
          </article>
        ))}

        {medications.map((medication) => (
          <article className="topic-card medication-card" key={`medication-${medication.id}`}>
            <div className="topic-card-header">
              <div>
                <span className="status-pill">Fármaco</span>
                <h2>{medication.generic_name || 'Medicamento sin nombre'}</h2>
                {medication.short_description && <p>{medication.short_description}</p>}
              </div>
              <Pill size={22} />
            </div>
            <div className="topic-meta">
              {medication.pharmacologic_group && <span>{medication.pharmacologic_group}</span>}
              <span>Modificado {formatDate(medication.updated_at)}</span>
            </div>
            <div className="card-actions">
              <Link className="ghost-button" to={`/farmacologia/${medication.id}`}>
                Abrir fármaco
              </Link>
              <button className="ghost-button" type="button" disabled={isReadOnly} onClick={() => medicationMutations.toggleFavorite.mutate(medication)}>
                Quitar favorito
              </button>
            </div>
          </article>
        ))}

        {procedures.map((procedure) => (
          <article className="topic-card procedure-card" key={`procedure-${procedure.id}`}>
            <div className="topic-card-header">
              <div>
                <span className="status-pill">Procedimiento</span>
                <h2>{procedure.name}</h2>
                {procedure.summary && <p>{procedure.summary}</p>}
              </div>
              <ClipboardList size={22} />
            </div>
            <div className="topic-meta">
              {procedure.category && <span>{procedure.category}</span>}
              <span>Modificado {formatDate(procedure.updated_at)}</span>
            </div>
            <div className="card-actions">
              <Link className="ghost-button" to={`/procedimientos/${procedure.id}`}>
                Abrir procedimiento
              </Link>
              <button className="ghost-button" type="button" disabled={isReadOnly} onClick={() => procedureMutations.toggleFavorite.mutate(procedure)}>
                Quitar favorito
              </button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && isEmpty && <div className="panel empty-state">Todavía no hay favoritos.</div>}
    </section>
  );
}
