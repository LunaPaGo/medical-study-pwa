import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Copy, Edit3, GitCompare, Heart, Trash2 } from 'lucide-react';
import { MedicationAttachmentsPanel } from '../features/medications/MedicationAttachmentsPanel';
import { MedicationRichViewer } from '../features/medications/MedicationRichViewer';
import { isRichFieldEmpty, medicationSections } from '../features/medications/medicationFields';
import { useMedicationData, useMedicationMutations } from '../features/medications/useMedicationData';
import { formatDate } from '../features/topics/topicUtils';
import { useAuth } from '../hooks/useAuth';

export function MedicationDetailPage() {
  const { medicationId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useMedicationData();
  const mutations = useMedicationMutations();
  const { isReadOnly } = useAuth();
  const medication = data?.medications.find((item) => item.id === medicationId);

  if (!isLoading && !medication) {
    return <Navigate to="/farmacologia" replace />;
  }

  if (!medication) {
    return <div className="panel empty-state">Cargando medicamento...</div>;
  }

  const name = medication.generic_name || 'Medicamento sin nombre';
  const visibleSections = medicationSections.filter((section) => section.fields.some((field) => !isRichFieldEmpty(medication[field.key])));

  const remove = () => {
    if (window.confirm(`¿Eliminar "${name}"?`)) {
      mutations.deleteMedication.mutate(medication.id, { onSuccess: () => navigate('/farmacologia') });
    }
  };

  return (
    <article className="reader-page medication-reader">
      <div className="reader-header">
        <div>
          <span className={`status-pill ${medication.status}`}>{medication.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h1>{name}</h1>
          {medication.short_description && <p>{medication.short_description}</p>}
        </div>
        <div className="heading-actions">
          <button className={`ghost-button ${medication.is_favorite ? 'favorite-active' : ''}`} type="button" disabled={isReadOnly} onClick={() => mutations.toggleFavorite.mutate(medication)}>
            <Heart size={18} fill="currentColor" />
            Favorito
          </button>
          <Link className="ghost-button" to={`/farmacologia/comparar?left=${medication.id}`}>
            <GitCompare size={18} />
            Comparar
          </Link>
          {isReadOnly ? (
            <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>
          ) : (
            <>
              <Link className="ghost-button" to={`/farmacologia/${medication.id}/editar`}>
                <Edit3 size={18} />
                Editar
              </Link>
              <button className="ghost-button" type="button" onClick={() => mutations.duplicateMedication.mutate(medication)}>
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

      <div className="topic-meta reader-meta">
        {medication.pharmacologic_group && <span>{medication.pharmacologic_group}</span>}
        {medication.pharmacologic_subgroup && <span>{medication.pharmacologic_subgroup}</span>}
        <span>Creado {formatDate(medication.created_at)}</span>
        <span>Modificado {formatDate(medication.updated_at)}</span>
      </div>

      <div className="chip-list">
        {medication.tags.map((tag) => (
          <span className="tag-chip" key={tag.id}>
            {tag.name}
          </span>
        ))}
      </div>

      {visibleSections.map((section) => (
        <details className="panel medication-section read-section" key={section.id} open>
          <summary>{section.title}</summary>
          <div className="medication-read-fields">
            {section.fields
              .filter((field) => !isRichFieldEmpty(medication[field.key]))
              .map((field) => (
                <section key={field.key} className="medication-read-field">
                  <h2>{field.label}</h2>
                  <MedicationRichViewer content={medication[field.key]} />
                </section>
              ))}
          </div>
        </details>
      ))}

      {visibleSections.length === 0 && <div className="panel empty-state">La ficha todavía no tiene secciones clínicas cargadas.</div>}

      <MedicationAttachmentsPanel medicationId={medication.id} attached={medication.attachments} readOnly={isReadOnly} />
    </article>
  );
}
