import { FormEvent, useState } from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { CalculatorInfo } from '../components/CalculatorInfo';
import {
  calculateExactAge,
  formatLocalDateInput,
  formatVaccinationAge,
  parseLocalCalendarDate,
  startOfLocalCalendarDay,
  validateManualVaccinationAge,
  type VaccinationInputMode,
  type VaccinationPatientContext
} from './vaccinationAge';
import {
  getConditionalRecommendations,
  getVaccinesDueNow,
  getVaccinesReached,
  type VaccinationRecommendationResult,
  type VaccinationScheduleEntry
} from './vaccinationSchedule';

type VaccinationResult = {
  context: VaccinationPatientContext;
  conditional: VaccinationRecommendationResult;
  current: VaccinationRecommendationResult;
  reached: VaccinationRecommendationResult;
};

function formatDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function HistoricalScheduleTable({ entries }: { entries: readonly VaccinationScheduleEntry[] }) {
  return (
    <div className="vaccination-history-scroll">
      <table className="vaccination-history-table">
        <thead>
          <tr>
            <th aria-label="Hito" />
            <th>Edad</th>
            <th>Vacuna</th>
            <th>Dosis</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="vaccination-milestone-cell" data-label="Hito"><span aria-hidden="true" className="vaccination-milestone-dot" /></td>
              <td data-label="Edad">{entry.ageWindow.label}</td>
              <td data-label="Vacuna"><strong>{entry.vaccine}</strong></td>
              <td data-label="Dosis">{entry.dose}</td>
              <td data-label="Descripción">{entry.description}{entry.notes && <small>{entry.notes}</small>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationCards({ entries, variant }: { entries: readonly VaccinationScheduleEntry[]; variant: 'current' | 'conditional' }) {
  return (
    <div className="vaccination-recommendation-grid">
      {entries.map((entry) => (
        <article className={`vaccination-recommendation-card ${variant}`} key={entry.id}>
          <div className="vaccination-recommendation-heading">
            <strong>{entry.vaccine}</strong>
            <span>{entry.ageWindow.label}</span>
          </div>
          <b>{entry.dose}</b>
          <p>{entry.description}</p>
          {entry.notes && <small>{entry.notes}</small>}
        </article>
      ))}
    </div>
  );
}

export function VaccinationCalculator() {
  const isOnline = useOnlineStatus();
  const [inputMode, setInputMode] = useState<VaccinationInputMode>('birthDate');
  const [birthDate, setBirthDate] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  const [error, setError] = useState('');
  const [result, setResult] = useState<VaccinationResult | null>(null);
  const today = startOfLocalCalendarDay(new Date());

  function clearInputs() {
    setBirthDate('');
    setYears('');
    setMonths('0');
    setDays('0');
    setError('');
    setResult(null);
  }

  function changeInputMode(nextMode: VaccinationInputMode) {
    if (nextMode === inputMode) return;
    setInputMode(nextMode);
    clearInputs();
  }

  function buildContext(): VaccinationPatientContext | null {
    if (inputMode === 'birthDate') {
      const parsedBirthDate = parseLocalCalendarDate(birthDate);
      if (!parsedBirthDate) {
        setError('Seleccioná una fecha de nacimiento válida.');
        return null;
      }
      if (parsedBirthDate.getTime() > today.getTime()) {
        setError('La fecha de nacimiento no puede ser futura.');
        return null;
      }
      return { age: calculateExactAge(parsedBirthDate, today), birthDate, inputMode, referenceDate: formatLocalDateInput(today) };
    }

    const validation = validateManualVaccinationAge(years, months, days);
    if (validation.age === null) {
      setError(validation.error);
      return null;
    }
    return { age: validation.age, inputMode, referenceDate: formatLocalDateInput(today) };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const context = buildContext();
    if (!context) {
      setResult(null);
      return;
    }

    setError('');
    setResult({
      context,
      conditional: getConditionalRecommendations(context),
      current: getVaccinesDueNow(context),
      reached: getVaccinesReached(context)
    });
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Alcance">
        Esta herramienta presenta las vacunas esperadas o recomendadas según edad y no determina por sí sola si una persona tiene el esquema completo.
      </CalculatorInfo>

      <section className="calculator-info-block vaccination-official-reference">
        <span>Referencia oficial</span>
        <a
          aria-describedby={!isOnline ? 'vaccination-official-reference-status' : undefined}
          className="ghost-button vaccination-official-reference-link"
          href="https://www.argentina.gob.ar/sites/default/files/2026-03-10_calendario_nacional_vacunacion_70x50_web.pdf"
          onClick={(event) => {
            if (!isOnline) event.preventDefault();
          }}
          rel="noopener noreferrer"
          target="_blank"
        >
          <CalendarDays aria-hidden="true" size={18} />
          <span>
            <strong>Ver Calendario Nacional 2026</strong>
            <small>Ministerio de Salud de la Nación Argentina</small>
          </span>
          <ExternalLink aria-hidden="true" size={16} />
        </a>
        {!isOnline && (
          <p className="vaccination-official-reference-status" id="vaccination-official-reference-status" role="status">
            Se necesita conexión a internet para abrir el calendario oficial.
          </p>
        )}
      </section>

      <fieldset className="calculator-option-group">
        <legend>Calcular por:</legend>
        <label>
          <input checked={inputMode === 'birthDate'} name="vaccination-input-mode" onChange={() => changeInputMode('birthDate')} type="radio" />
          Fecha de nacimiento
        </label>
        <label>
          <input checked={inputMode === 'age'} name="vaccination-input-mode" onChange={() => changeInputMode('age')} type="radio" />
          Edad
        </label>
      </fieldset>

      {inputMode === 'birthDate' ? (
        <label>
          Fecha de nacimiento
          <input
            max={formatLocalDateInput(today)}
            onChange={(event) => {
              setBirthDate(event.target.value);
              setError('');
              setResult(null);
            }}
            type="date"
            value={birthDate}
          />
        </label>
      ) : (
        <section className="calculator-info-block">
          <span>Edad</span>
          <div className="calculator-interpretation-grid">
            <label>
              Años
              <input inputMode="numeric" min="0" onChange={(event) => {
                setYears(event.target.value);
                setError('');
                setResult(null);
              }} step="1" type="number" value={years} />
            </label>
            <label>
              Meses
              <input inputMode="numeric" max="11" min="0" onChange={(event) => {
                setMonths(event.target.value);
                setError('');
                setResult(null);
              }} step="1" type="number" value={months} />
            </label>
            <label>
              Días
              <input inputMode="numeric" max="30" min="0" onChange={(event) => {
                setDays(event.target.value);
                setError('');
                setResult(null);
              }} step="1" type="number" value={days} />
            </label>
          </div>
        </section>
      )}

      {error && <div className="notice warning">{error}</div>}

      <div className="calculator-actions">
        <button className="primary-button" type="submit">Calcular</button>
        <button className="ghost-button" type="button" onClick={clearInputs}>Reiniciar</button>
      </div>

      {result && !error && (
        <div aria-live="polite" className="vaccination-results">
          <header className="vaccination-result-summary">
            <article>
              <span>Edad actual</span>
              <strong>{formatVaccinationAge(result.context.age)}</strong>
              <small>Calculado al {formatDisplayDate(result.context.referenceDate)}</small>
            </article>
            <article>
              <span>Modo de cálculo</span>
              <strong>{result.context.inputMode === 'birthDate' ? 'Fecha de nacimiento' : 'Edad ingresada'}</strong>
              <small>{result.context.birthDate ? formatDisplayDate(result.context.birthDate) : formatVaccinationAge(result.context.age)}</small>
            </article>
            <article>
              <span>Referencia</span>
              <strong>Calendario Nacional de Vacunación 2026</strong>
              <small>Ministerio de Salud de la Nación Argentina</small>
            </article>
          </header>

          <div className="vaccination-dashboard">
            <section className="vaccination-results-panel vaccination-history-panel">
              <div className="vaccination-panel-heading">
                <span className="vaccination-panel-kicker">Historial esperado por edad</span>
                <h3>Debería haber recibido según calendario</h3>
              </div>
              {result.reached.entries.length > 0 ? (
                <HistoricalScheduleTable entries={result.reached.entries} />
              ) : (
                <p className="vaccination-empty-state">No se reconstruyen retrospectivamente calendarios pediátricos históricos que no estén modelados.</p>
              )}
            </section>

            <div className="vaccination-dashboard-side">
              <section className="vaccination-results-panel vaccination-current-panel">
                <div className="vaccination-panel-heading">
                  <span className="vaccination-panel-kicker">Hito activo</span>
                  <h3>Corresponde actualmente</h3>
                </div>
                {result.current.entries.length > 0 ? (
                  <RecommendationCards entries={result.current.entries} variant="current" />
                ) : (
                  <p className="vaccination-empty-state">No hay un hito rutinario específico del calendario para esta edad.</p>
                )}
                <p className="vaccination-panel-footnote">Esto no permite determinar si existen esquemas incompletos.</p>
              </section>

              <section className="vaccination-results-panel vaccination-conditional-panel">
                <div className="vaccination-panel-heading">
                  <span className="vaccination-panel-kicker">Requiere contexto adicional</span>
                  <h3>Indicaciones a verificar según antecedentes o situación</h3>
                </div>
                {result.conditional.entries.length > 0 ? (
                  <RecommendationCards entries={result.conditional.entries} variant="conditional" />
                ) : (
                  <p className="vaccination-empty-state">No hay indicaciones condicionales específicas identificadas solamente con estos datos.</p>
                )}
                {result.conditional.warnings.map((warning) => <p className="vaccination-context-warning" key={warning}>{warning}</p>)}
              </section>
            </div>
          </div>
        </div>
      )}

      <section className="vaccination-important-notes">
        <div>
          <span>Notas importantes</span>
          <p>Esta herramienta presenta las vacunas esperadas o recomendadas según edad y no determina por sí sola si una persona tiene el esquema completo.</p>
          <p>Para determinar dosis faltantes es necesario revisar el carnet y los antecedentes de vacunación.</p>
          <p>Embarazo, inmunocompromiso, enfermedades crónicas, personal de salud, condiciones epidemiológicas y otras situaciones especiales pueden modificar las indicaciones.</p>
          <p>Basado en el Calendario Nacional de Vacunación 2026 — Ministerio de Salud de la Nación Argentina.</p>
        </div>
      </section>
    </form>
  );
}
