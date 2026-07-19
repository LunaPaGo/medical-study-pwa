import { Link } from 'react-router-dom';
import { Copy, GitCompare, Heart, Pencil, Trash2 } from 'lucide-react';
import type { MedicationWithRelations } from '../../types/medication';
import { formatDate } from '../topics/topicUtils';
import type { StudyListViewMode } from '../theme/useStudyListViewPreference';

type Props = {
  medication: MedicationWithRelations;
  selected: boolean;
  readOnly?: boolean;
  viewMode?: StudyListViewMode;
  onSelect: (medication: MedicationWithRelations, selected: boolean) => void;
  onDelete: (medication: MedicationWithRelations) => void;
  onDuplicate: (medication: MedicationWithRelations) => void;
  onToggleFavorite: (medication: MedicationWithRelations) => void;
};

export function MedicationCard({ medication, selected, readOnly = false, viewMode = 'grid', onSelect, onDelete, onDuplicate, onToggleFavorite }: Props) {
  const name = medication.generic_name || 'Medicamento sin nombre';

  if (viewMode === 'list') {
    return (
      <article className="topic-card medication-card topic-card-list">
        <div className="compact-card-main">
          <div className="compact-card-title-row">
            <span className={`status-pill ${medication.status}`}>{medication.status === 'complete' ? 'Completo' : 'Borrador'}</span>
            <h2>
              <Link to={`/farmacologia/${medication.id}`}>{name}</Link>
            </h2>
            <span className="compact-updated">Modificado {formatDate(medication.updated_at)}</span>
          </div>
          {medication.short_description && <p>{medication.short_description}</p>}
          <div className="compact-card-actions">
            <label className="ghost-button checkbox-label compare-check">
              <input checked={selected} type="checkbox" onChange={(event) => onSelect(medication, event.target.checked)} />
              Comparar
            </label>
            {!readOnly && (
              <Link className="ghost-button" to={`/farmacologia/${medication.id}/editar`}>
                Editar
              </Link>
            )}
            <button
              className={`ghost-button ${medication.is_favorite ? 'favorite-active' : ''}`}
              disabled={readOnly}
              type="button"
              onClick={() => onToggleFavorite(medication)}
            >
              Favorito
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="topic-card medication-card">
      <div className="topic-card-header">
        <div>
          <span className={`status-pill ${medication.status}`}>{medication.status === 'complete' ? 'Completo' : 'Borrador'}</span>
          <h2>
            <Link to={`/farmacologia/${medication.id}`}>{name}</Link>
          </h2>
          {medication.short_description && <p>{medication.short_description}</p>}
        </div>
        <button
          className={`favorite-button ${medication.is_favorite ? 'active' : ''}`}
          disabled={readOnly}
          type="button"
          onClick={() => onToggleFavorite(medication)}
          title={medication.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
        >
          <Heart size={20} fill="currentColor" />
        </button>
      </div>

      <div className="topic-meta">
        {medication.pharmacologic_group && <span>{medication.pharmacologic_group}</span>}
        {medication.pharmacologic_subgroup && <span>{medication.pharmacologic_subgroup}</span>}
        <span>Modificado {formatDate(medication.updated_at)}</span>
      </div>

      <div className="chip-list">
        {medication.tags.map((tag) => (
          <span className="tag-chip" key={tag.id}>
            {tag.name}
          </span>
        ))}
      </div>

      <div className="card-actions">
        <label className="checkbox-label compare-check">
          <input checked={selected} type="checkbox" onChange={(event) => onSelect(medication, event.target.checked)} />
          <GitCompare size={18} />
          Comparar
        </label>
        {readOnly ? (
          <span className="notice warning readonly-inline">Solo lectura</span>
        ) : (
          <>
            <Link className="ghost-button" to={`/farmacologia/${medication.id}/editar`}>
              <Pencil size={18} />
              Editar
            </Link>
            <button className="ghost-button" type="button" onClick={() => onDuplicate(medication)}>
              <Copy size={18} />
              Duplicar
            </button>
            <button className="ghost-button danger-action" type="button" onClick={() => onDelete(medication)}>
              <Trash2 size={18} />
              Eliminar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
