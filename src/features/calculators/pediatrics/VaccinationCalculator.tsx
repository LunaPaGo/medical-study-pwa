import { FormEvent, useState } from 'react';
import {
  calculateExactAge,
  formatLocalDateInput,
  parseLocalCalendarDate,
  startOfLocalCalendarDay,
  type ExactAge
} from './vaccinationAge';

export function VaccinationCalculator() {
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExactAge | null>(null);
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
    setResult(calculateExactAge(parsedBirthDate, today));
  }

  function resetCalculator() {
    setBirthDate('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
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
        <div className="calculator-result" aria-live="polite">
          <span>Edad exacta</span>
          <strong>
            {result.years} años, {result.months} meses, {result.days} días
          </strong>
        </div>
      )}
    </form>
  );
}
