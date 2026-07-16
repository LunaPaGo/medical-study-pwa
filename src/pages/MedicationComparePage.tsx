import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { MedicationRichViewer } from '../features/medications/MedicationRichViewer';
import { isRichFieldEmpty, medicationCompareSections } from '../features/medications/medicationFields';
import { useMedicationData } from '../features/medications/useMedicationData';
import type { MedicationWithRelations } from '../types/medication';

type TextField = {
  key: keyof Pick<MedicationWithRelations, 'generic_name' | 'pharmacologic_group' | 'pharmacologic_subgroup'>;
  label: string;
};

const textFields: TextField[] = [
  { key: 'generic_name', label: 'Nombre genérico' },
  { key: 'pharmacologic_group', label: 'Grupo farmacológico' },
  { key: 'pharmacologic_subgroup', label: 'Subgrupo farmacológico' }
];

function medicationName(medication: MedicationWithRelations | undefined) {
  return medication?.generic_name || 'Sin seleccionar';
}

function TextCompareRow({ label, left, right }: { label: string; left: string | null | undefined; right: string | null | undefined }) {
  if (!left && !right) return null;

  return (
    <div className="compare-row">
      <div className="compare-label">{label}</div>
      <div>{left || <span className="empty-state">Sin información cargada</span>}</div>
      <div>{right || <span className="empty-state">Sin información cargada</span>}</div>
    </div>
  );
}

export function MedicationComparePage() {
  const { data, isLoading } = useMedicationData();
  const [params, setParams] = useSearchParams();
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const leftId = params.get('left') ?? '';
  const rightId = params.get('right') ?? '';
  const left = data?.medications.find((medication) => medication.id === leftId);
  const right = data?.medications.find((medication) => medication.id === rightId);

  const filterOptions = (query: string) => {
    const needle = query.trim().toLowerCase();
    return (data?.medications ?? []).filter((medication) => !needle || medication.search_text.includes(needle));
  };

  const visibleSections = useMemo(
    () =>
      medicationCompareSections
        .map((section) => ({
          ...section,
          fields: section.fields.filter((field) => left && right && (!isRichFieldEmpty(left[field.key]) || !isRichFieldEmpty(right[field.key])))
        }))
        .filter((section) => section.fields.length > 0),
    [left, right]
  );

  const updateParam = (side: 'left' | 'right', value: string) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(side, value);
    } else {
      next.delete(side);
    }
    setParams(next, { replace: true });
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Farmacología</span>
          <h1>Comparador de fármacos</h1>
          <p>Seleccioná exactamente dos medicamentos. La comparación lee directamente las fichas existentes.</p>
        </div>
        <Link className="ghost-button" to="/farmacologia">
          Volver al listado
        </Link>
      </div>

      <section className="panel compare-picker">
        <div>
          <label>
            Buscar primer medicamento
            <input value={leftSearch} onChange={(event) => setLeftSearch(event.target.value)} placeholder="Buscar" />
          </label>
          <select value={leftId} onChange={(event) => updateParam('left', event.target.value)}>
            <option value="">Seleccionar</option>
            {filterOptions(leftSearch).map((medication) => (
              <option key={medication.id} value={medication.id}>
                {medication.generic_name || 'Medicamento sin nombre'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>
            Buscar segundo medicamento
            <input value={rightSearch} onChange={(event) => setRightSearch(event.target.value)} placeholder="Buscar" />
          </label>
          <select value={rightId} onChange={(event) => updateParam('right', event.target.value)}>
            <option value="">Seleccionar</option>
            {filterOptions(rightSearch).map((medication) => (
              <option key={medication.id} value={medication.id}>
                {medication.generic_name || 'Medicamento sin nombre'}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading && <div className="panel empty-state">Cargando medicamentos...</div>}

      {(!left || !right) && !isLoading && (
        <div className="panel empty-state">
          <GitCompare size={24} />
          Seleccioná dos medicamentos para ver la comparación.
        </div>
      )}

      {left && right && (
        <section className="compare-table">
          <div className="compare-header">
            <div />
            <strong>{medicationName(left)}</strong>
            <strong>{medicationName(right)}</strong>
          </div>

          {textFields.map((field) => (
            <TextCompareRow key={field.key} label={field.label} left={left[field.key]} right={right[field.key]} />
          ))}

          {visibleSections.map((section) => (
            <details className="panel medication-section compare-section" key={section.id} open>
              <summary>{section.title}</summary>
              {section.fields.map((field) => (
                <div className="compare-row rich-compare-row" key={field.key}>
                  <div className="compare-label">{field.label}</div>
                  <div>{isRichFieldEmpty(left[field.key]) ? <span className="empty-state">Sin información cargada</span> : <MedicationRichViewer content={left[field.key]} />}</div>
                  <div>{isRichFieldEmpty(right[field.key]) ? <span className="empty-state">Sin información cargada</span> : <MedicationRichViewer content={right[field.key]} />}</div>
                </div>
              ))}
            </details>
          ))}
        </section>
      )}
    </section>
  );
}
