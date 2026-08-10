import { FormEvent, useState } from 'react';
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
  getCurrentVaccinationMilestones,
  getReachedVaccinationMilestones,
  type VaccinationRecommendationResult,
  type VaccinationScheduleEntry
} from './vaccinationSchedule';

type VaccinationResult = {
  context: VaccinationPatientContext;
  current: VaccinationRecommendationResult;
  reached: VaccinationRecommendationResult;
};

type MilestoneListProps = {
  milestones: readonly VaccinationScheduleEntry[];
};

function MilestoneList({ milestones }: MilestoneListProps) {
  return (
    <ul className="calculator-interpretation-list">
      {milestones.map((milestone) => (
        <li key={milestone.id}>
          <strong>{milestone.ageWindow.label} — {milestone.vaccine}: {milestone.dose}.</strong>{' '}
          {milestone.description}
          {milestone.observation && <> {milestone.observation}</>}
        </li>
      ))}
    </ul>
  );
}

export function VaccinationCalculator() {
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
      return { age: calculateExactAge(parsedBirthDate, today), birthDate, inputMode };
    }

    const validation = validateManualVaccinationAge(years, months, days);
    if (validation.age === null) {
      setError(validation.error);
      return null;
    }
    return { age: validation.age, inputMode };
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
      current: getCurrentVaccinationMilestones(context),
      reached: getReachedVaccinationMilestones(context)
    });
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Alcance">
        Esta herramienta muestra el calendario esperado por edad y no determina por sí sola si una persona tiene el esquema completo.
      </CalculatorInfo>

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
        <div aria-live="polite">
          <div className="calculator-result">
            <span>Edad actual</span>
            <strong>{formatVaccinationAge(result.context.age)}</strong>
          </div>

          <section className="calculator-info-block">
            <span>Debería haber recibido según calendario</span>
            <MilestoneList milestones={result.reached.milestones} />
            {result.reached.warnings.map((warning) => <p className="notice warning" key={warning}>{warning}</p>)}
          </section>

          <section className="calculator-info-block">
            <span>Corresponde actualmente</span>
            {result.current.milestones.length > 0 ? (
              <MilestoneList milestones={result.current.milestones} />
            ) : (
              <p>No hay un hito rutinario específico del calendario para esta edad.</p>
            )}
            {result.current.warnings.map((warning) => <p className="notice warning" key={warning}>{warning}</p>)}
            <p>Esto no permite determinar si existen esquemas incompletos.</p>
          </section>
        </div>
      )}

      <CalculatorInfo title="Importante">
        Para determinar vacunas faltantes es necesario revisar el carnet y los antecedentes de vacunación.
      </CalculatorInfo>

      <CalculatorInfo title="Fuente">
        Basado en el Calendario Nacional de Vacunación 2026 del Ministerio de Salud de la Nación Argentina.
      </CalculatorInfo>
    </form>
  );
}
