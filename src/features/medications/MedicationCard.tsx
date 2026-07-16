import { Link } from 'react-router-dom';
import { Copy, GitCompare, Heart, Pencil, Trash2 } from 'lucide-react';
import type { MedicationWithRelations } from '../../types/medication';
import { formatDate } from '../topics/topicUtils';

type Props = {
  medication: MedicationWithRelations;
  selected: boolean;
  onSelect: (medication: MedicationWithRelations, selected: boolean) => void;
  onDelete: (medication: MedicationWithRelations) => void;
  onDuplicate: (medication: MedicationWithRelations) => void;
  onToggleFavorite: (medication: MedicationWithRelations) => void;
};

export function MedicationCard({ medication, selected, onSelect, onDelete, onDuplicate, onToggleFavorite }: Props) {
  const name = medication.generic_name || 'Medicamento sin nombre';

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
      </div>
    </article>
  );
}
