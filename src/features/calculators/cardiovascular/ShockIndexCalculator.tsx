import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateShockIndex } from './shockIndex';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function ShockIndexCalculator() {
  const [heartRate, setHeartRate] = useState('');
  const [systolicPressure, setSystolicPressure] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rate = parsePositiveNumber(heartRate);
    const systolic = parsePositiveNumber(systolicPressure);

    if (rate === null || systolic === null) {
      setResult(null);
      setError('Completá la frecuencia cardíaca y la presión arterial sistólica.');
      return;
    }

    if (!Number.isFinite(rate) || !Number.isFinite(systolic) || rate <= 0 || systolic <= 0) {
      setResult(null);
      setError('Ingresá valores numéricos positivos mayores que cero.');
      return;
    }

    if (rate < 20 || rate > 300) {
      setResult(null);
      setError('Revisá la frecuencia cardíaca ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    if (systolic < 40 || systolic > 300) {
      setResult(null);
      setError('Revisá la presión sistólica ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    setError('');
    setResult(calculateShockIndex(rate, systolic));
  }

  function resetCalculator() {
    setHeartRate('');
    setSystolicPressure('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Herramienta orientativa para la detección temprana de compromiso hemodinámico en pacientes agudos o críticos.
      </CalculatorInfo>

      <CalculatorFormula formulas={['Índice de Shock = FC / PAS']} />

      <label>
        Frecuencia cardíaca
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setHeartRate(event.target.value)}
            placeholder="90"
            type="number"
            value={heartRate}
          />
          <span>lpm</span>
        </div>
      </label>

      <label>
        Presión arterial sistólica
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
          <span>Resultado Índice de Shock</span>
          <strong>{result.toFixed(2)}</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>0,50–0,70: rango habitualmente esperado en adultos hemodinámicamente estables.</li>
          <li>0,71–0,89: valor aumentado; interpretar según el contexto clínico.</li>
          <li>≥ 0,90: puede sugerir compromiso hemodinámico y requiere valoración clínica.</li>
          <li>≥ 1,00: mayor nivel de preocupación clínica.</li>
        </ul>
        <p>
          El Índice de Shock no diagnostica por sí solo un estado de choque. Puede verse afectado por edad, embarazo,
          medicación, arritmias, marcapasos y otras condiciones clínicas.
        </p>
      </CalculatorInterpretation>
    </form>
  );
}
