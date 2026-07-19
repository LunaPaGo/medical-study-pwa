import { FormEvent, useMemo, useState } from 'react';
import { CalculatorFormula } from './CalculatorFormula';
import { CalculatorInfo } from './CalculatorInfo';
import { CalculatorInterpretation } from './CalculatorInterpretation';
import {
  calculateClinicalScore,
  type ClinicalScoreConfig,
  type ClinicalScoreResult,
  type ClinicalScoreSelections
} from './clinicalScore';

type ClinicalScoreCalculatorProps = {
  config: ClinicalScoreConfig;
};

function formatPoints(points: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(points);
}

function criterionText(label: string, points: number) {
  return `${label} — ${formatPoints(points)} ${points === 1 ? 'punto' : 'puntos'}`;
}

function getInitialSelections(config: ClinicalScoreConfig): ClinicalScoreSelections {
  return Object.fromEntries(config.groups.map((group) => [group.id, []]));
}

export function ClinicalScoreCalculator({ config }: ClinicalScoreCalculatorProps) {
  const initialSelections = useMemo(() => getInitialSelections(config), [config]);
  const [selections, setSelections] = useState<ClinicalScoreSelections>(initialSelections);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ClinicalScoreResult | null>(null);

  function updateSelection(groupId: string, criterionId: string, checked: boolean, selectionMode: 'multiple' | 'single') {
    setSelections((current) => {
      if (selectionMode === 'single') {
        return {
          ...current,
          [groupId]: checked ? [criterionId] : []
        };
      }

      const selected = new Set(current[groupId] ?? []);
      if (checked) {
        selected.add(criterionId);
      } else {
        selected.delete(criterionId);
      }

      return {
        ...current,
        [groupId]: Array.from(selected)
      };
    });
    setResult(null);
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missingRequiredGroup = config.groups.find((group) => group.required && (selections[group.id] ?? []).length === 0);
    if (missingRequiredGroup) {
      setResult(null);
      setError(`Seleccioná una opción en ${missingRequiredGroup.title ?? 'cada criterio requerido'}.`);
      return;
    }

    setError('');
    setResult(calculateClinicalScore(config, selections));
  }

  function resetCalculator() {
    setSelections(initialSelections);
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">{config.description}</CalculatorInfo>

      {config.criteriaSummary && config.criteriaSummary.length > 0 && (
        <CalculatorFormula title="Criterios utilizados" formulas={config.criteriaSummary} />
      )}

      <section className="calculator-info-block">
        <span>Criterios</span>
        {config.groups.map((group) => (
          <fieldset className="calculator-option-group" key={group.id}>
            {group.title && <legend>{group.title}</legend>}
            {group.criteria.map((criterion) => {
              const isSelected = (selections[group.id] ?? []).includes(criterion.id);
              return (
                <label key={criterion.id}>
                  <input
                    checked={isSelected}
                    name={`${config.title}-${group.id}`}
                    onChange={(event) => updateSelection(group.id, criterion.id, event.target.checked, group.selectionMode)}
                    type={group.selectionMode === 'single' ? 'radio' : 'checkbox'}
                  />
                  {criterionText(criterion.label, criterion.points)}
                </label>
              );
            })}
          </fieldset>
        ))}
      </section>

      {error && <div className="notice warning">{error}</div>}

      <div className="calculator-actions">
        <button className="primary-button" type="submit">
          Calcular
        </button>
        <button className="ghost-button" type="button" onClick={resetCalculator}>
          Reiniciar
        </button>
      </div>

      {result && !error && (
        <div className="calculator-result" aria-live="polite">
          <span>Puntaje obtenido</span>
          <strong>
            {formatPoints(result.score)} {result.score === 1 ? 'punto' : 'puntos'}
          </strong>
          {result.interpretation && (
            <>
              <span>Interpretación correspondiente</span>
              <strong>{result.interpretation.label}</strong>
              {result.interpretation.description && <p>{result.interpretation.description}</p>}
            </>
          )}
          {result.additionalInterpretations.map((interpretation) => (
            <p key={interpretation.label}>
              <strong>{interpretation.label}:</strong> {interpretation.description}
            </p>
          ))}
          <span>Criterios positivos</span>
          {result.positiveCriteria.length > 0 ? (
            <ul>
              {result.positiveCriteria.map((criterion) => (
                <li key={criterion.id}>✓ {criterionText(criterion.label, criterion.points)}</li>
              ))}
            </ul>
          ) : (
            <p>No se seleccionaron criterios positivos.</p>
          )}
          <span>Criterios negativos</span>
          <ul>
            {result.negativeCriteria.map((criterion) => (
              <li key={criterion.id}>• {criterionText(criterion.label, criterion.points)}</li>
            ))}
          </ul>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          {config.interpretationRules.map((rule) => (
            <li key={rule.label}>
              <strong>{rule.label}:</strong> {rule.description}
            </li>
          ))}
        </ul>
        {config.additionalResultSections && config.additionalResultSections.length > 0 && (
          <>
            {config.additionalResultSections.map((rule) => (
              <p key={rule.label}>
                <strong>{rule.label}:</strong> {rule.description}
              </p>
            ))}
          </>
        )}
      </CalculatorInterpretation>

      {config.warnings.length > 0 && (
        <section className="calculator-info-block">
          <span>Advertencias</span>
          <ul className="calculator-interpretation-list">
            {config.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      {config.references.length > 0 && (
        <section className="calculator-info-block">
          <span>Referencias</span>
          <ul className="calculator-interpretation-list">
            {config.references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </section>
      )}
    </form>
  );
}
