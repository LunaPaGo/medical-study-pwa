import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import {
  calculateGestationalAgeFromUltrasound,
  differenceInCalendarDays,
  parseLocalDate,
  startOfLocalDay,
  type GestationalAgeResult
} from './gestationalAge';

function parseInteger(value: string) {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return Number.NaN;
  return Number(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatGestationalAge(weeks: number, days: number) {
  return `${weeks} semanas + ${days} días`;
}

export function GestationalAgeCalculator() {
  const [ultrasoundDate, setUltrasoundDate] = useState('');
  const [weeks, setWeeks] = useState('');
  const [days, setDays] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<GestationalAgeResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedUltrasoundDate = parseLocalDate(ultrasoundDate);
    const parsedWeeks = parseInteger(weeks);
    const parsedDays = parseInteger(days);
    const today = startOfLocalDay(new Date());

    if (!parsedUltrasoundDate) {
      setResult(null);
      setError('Seleccioná una fecha válida de ultrasonido.');
      return;
    }

    if (differenceInCalendarDays(parsedUltrasoundDate, today) > 0) {
      setResult(null);
      setError('La fecha del ultrasonido no puede ser futura.');
      return;
    }

    if (parsedWeeks === null) {
      setResult(null);
      setError('Completá las semanas de edad gestacional al ultrasonido.');
      return;
    }

    if (parsedDays === null) {
      setResult(null);
      setError('Completá los días de edad gestacional al ultrasonido.');
      return;
    }

    if (!Number.isInteger(parsedWeeks) || !Number.isFinite(parsedWeeks) || parsedWeeks < 0 || parsedWeeks > 42) {
      setResult(null);
      setError('Las semanas deben ser un número entero entre 0 y 42.');
      return;
    }

    if (!Number.isInteger(parsedDays) || !Number.isFinite(parsedDays) || parsedDays < 0 || parsedDays > 6) {
      setResult(null);
      setError('Los días deben ser un número entero entre 0 y 6.');
      return;
    }

    const ultrasoundGestationalAgeDays = parsedWeeks * 7 + parsedDays;
    if (ultrasoundGestationalAgeDays > 294) {
      setResult(null);
      setError('La edad gestacional ecográfica no puede superar 42+0 semanas.');
      return;
    }

    const calculated = calculateGestationalAgeFromUltrasound(parsedUltrasoundDate, ultrasoundGestationalAgeDays, today);
    if (calculated.currentGestationalAge.weeks < 0 || calculated.currentGestationalAge.days < 0) {
      setResult(null);
      setError('Los datos ingresados producen una edad gestacional negativa. Revisá la fecha y la edad gestacional de la ecografía.');
      return;
    }

    setError('');
    setResult(calculated);
  }

  function resetCalculator() {
    setUltrasoundDate('');
    setWeeks('');
    setDays('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Estima la edad gestacional actual y las principales fechas obstétricas a partir de la fecha de una ecografía y de la edad gestacional registrada en ese estudio.
      </CalculatorInfo>

      <CalculatorInfo title="Aclaración">
        La FUM obtenida es una FUM obstétrica estimada a partir de la datación ecográfica, no necesariamente la fecha menstrual real informada por la paciente.
      </CalculatorInfo>

      <CalculatorFormula
        title="Método de cálculo"
        formulas={[
          'FUM estimada = fecha del ultrasonido − edad gestacional ecográfica en días',
          'FPP = FUM estimada + 280 días',
          'Inicio del segundo trimestre = FUM estimada + 98 días',
          'Inicio del tercer trimestre = FUM estimada + 196 días'
        ]}
      />

      <label>
        Fecha del ultrasonido
        <input onChange={(event) => setUltrasoundDate(event.target.value)} type="date" value={ultrasoundDate} />
      </label>

      <section className="calculator-info-block">
        <span>Edad gestacional al ultrasonido</span>
        <div className="gestational-age-grid">
          <label>
            Semanas
            <input inputMode="numeric" max="42" min="0" onChange={(event) => setWeeks(event.target.value)} step="1" type="number" value={weeks} />
          </label>
          <label>
            Días
            <input inputMode="numeric" max="6" min="0" onChange={(event) => setDays(event.target.value)} step="1" type="number" value={days} />
          </label>
        </div>
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
          <span>Calculado al</span>
          <strong>{formatDate(result.referenceDate)}</strong>
          <span>Edad gestacional actual</span>
          <strong>
            {formatGestationalAge(result.currentGestationalAge.weeks, result.currentGestationalAge.days)} ({result.currentGestationalAge.weeks}+
            {result.currentGestationalAge.days} semanas)
          </strong>
          <span>FUM obstétrica estimada</span>
          <strong>{formatDate(result.estimatedLmp)}</strong>
          <span>Inicio del segundo trimestre</span>
          <strong>{formatDate(result.secondTrimesterStart)}</strong>
          <span>Inicio del tercer trimestre</span>
          <strong>{formatDate(result.thirdTrimesterStart)}</strong>
          <span>Fecha probable de parto</span>
          <strong>{formatDate(result.dueDate)}</strong>
          <span>Situación temporal</span>
          <strong>{result.temporalSituation}</strong>
          {result.isDueDatePassed && <p>La fecha probable de parto estimada ya transcurrió.</p>}
          {result.isOver42Weeks && <p>La edad gestacional actual calculada supera las 42 semanas. Revisá los datos ingresados o confirmá si el embarazo ya finalizó.</p>}
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>La fecha probable de parto es una estimación.</li>
          <li>La datación definitiva del embarazo debe basarse en los criterios obstétricos y ecográficos aplicables.</li>
          <li>La ecografía del primer trimestre es generalmente la más precisa para establecer o confirmar la edad gestacional.</li>
          <li>La FUM mostrada es una fecha obstétrica calculada retrospectivamente desde la ecografía.</li>
          <li>No debe modificarse automáticamente una fecha probable de parto previamente establecida sin aplicar criterios clínicos de redatación.</li>
          <li>Esta herramienta no reemplaza la evaluación obstétrica ni el informe ecográfico.</li>
        </ul>
      </CalculatorInterpretation>
    </form>
  );
}
