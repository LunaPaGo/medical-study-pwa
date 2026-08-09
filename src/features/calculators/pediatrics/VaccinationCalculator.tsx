import { FormEvent, useState } from 'react';
import { CalculatorInfo } from '../components/CalculatorInfo';
import {
  calculateExactAge,
  formatLocalDateInput,
  parseLocalCalendarDate,
  startOfLocalCalendarDay,
  type ExactAge
} from './vaccinationAge';
import {
  getCurrentVaccinationMilestones,
  getReachedVaccinationMilestones,
  type VaccinationScheduleEntry
} from './vaccinationSchedule';

type VaccinationResult = {
  age: ExactAge;
  currentMilestones: readonly VaccinationScheduleEntry[];
  reachedMilestones: readonly VaccinationScheduleEntry[];
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
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<VaccinationResult | null>(null);
  const today = startOfLocalCalendarDay(new Date());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedBirthDate = parseLocalCalendarDate(birthDate);
    if (!parsedBirthDate) {
      setResult(null);
      setError('Seleccioná una fecha de nacimiento válida.');
      return;
    }

    if (parsedBirthDate.getTime() > today.getTime()) {
      setResult(null);
      setError('La fecha de nacimiento no puede ser futura.');
      return;
    }

    setError('');
    setResult({
      age: calculateExactAge(parsedBirthDate, today),
      currentMilestones: getCurrentVaccinationMilestones(parsedBirthDate, today),
      reachedMilestones: getReachedVaccinationMilestones(parsedBirthDate, today)
    });
  }

  function resetCalculator() {
    setBirthDate('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Alcance">
        Esta herramienta muestra el calendario esperado por edad y no determina por sí sola si una persona tiene el esquema completo.
      </CalculatorInfo>

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
        <div aria-live="polite">
          <div className="calculator-result">
            <span>Edad actual</span>
            <strong>
              {result.age.years} años, {result.age.months} meses, {result.age.days} días
            </strong>
          </div>

          <section className="calculator-info-block">
            <span>Debería haber recibido según calendario</span>
            <MilestoneList milestones={result.reachedMilestones} />
          </section>

          <section className="calculator-info-block">
            <span>Corresponde actualmente</span>
            {result.currentMilestones.length > 0 ? (
              <MilestoneList milestones={result.currentMilestones} />
            ) : (
              <p>No hay un hito rutinario específico del calendario para esta edad.</p>
            )}
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
