import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateMeanArterialPressure } from './meanArterialPressure';

function parsePressure(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatResult(value: number) {
  return new Intl.NumberFormat('es', {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1
  }).format(value);
}

export function MeanArterialPressureCalculator() {
  const [systolicPressure, setSystolicPressure] = useState('');
  const [diastolicPressure, setDiastolicPressure] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const systolic = parsePressure(systolicPressure);
    const diastolic = parsePressure(diastolicPressure);

    if (systolic === null || diastolic === null) {
      setResult(null);
      setError('Completá la presión sistólica y la presión diastólica.');
      return;
    }

    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || systolic <= 0 || diastolic <= 0) {
      setResult(null);
      setError('Ingresá valores numéricos positivos mayores que cero.');
      return;
    }

    if (systolic <= diastolic) {
      setResult(null);
      setError('La presión sistólica debe ser mayor que la presión diastólica.');
      return;
    }

    setError('');
    setResult(calculateMeanArterialPressure(systolic, diastolic));
  }

  function resetCalculator() {
    setSystolicPressure('');
    setDiastolicPressure('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Nombre de la calculadora">Presión Arterial Media</CalculatorInfo>

      <CalculatorInfo title="Qué representa">
        Estimación de la presión promedio que impulsa el flujo sanguíneo sistémico durante un ciclo cardíaco.
      </CalculatorInfo>

      <CalculatorFormula formulas={['PAM = PAD + (PAS − PAD) / 3', 'PAM = (PAS + 2 × PAD) / 3']} />

      <label>
        Presión arterial sistólica (PAS)
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setSystolicPressure(event.target.value)}
            placeholder="120"
            type="number"
            value={systolicPressure}
          />
          <span>mmHg</span>
        </div>
      </label>

      <label>
        Presión arterial diastólica (PAD)
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setDiastolicPressure(event.target.value)}
            placeholder="80"
            type="number"
            value={diastolicPressure}
          />
          <span>mmHg</span>
        </div>
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

      {result !== null && !error && (
        <div className="calculator-result" aria-live="polite">
          <span>Resultado PAM</span>
          <strong>{formatResult(result)} mmHg</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <p>
          No debe presentarse un valor aislado como diagnóstico. La PAM es un dato orientativo y su interpretación depende
          del contexto clínico, la situación hemodinámica y los objetivos terapéuticos de cada paciente.
        </p>
      </CalculatorInterpretation>
    </form>
  );
}
