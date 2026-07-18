import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateBazettQtc } from './bazettQtc';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function BazettQtcCalculator() {
  const [qtMilliseconds, setQtMilliseconds] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const qt = parsePositiveNumber(qtMilliseconds);
    const rate = parsePositiveNumber(heartRate);

    if (qt === null || rate === null) {
      setResult(null);
      setError('Completá el QT y la frecuencia cardíaca.');
      return;
    }

    if (!Number.isFinite(qt) || !Number.isFinite(rate) || qt <= 0 || rate <= 0) {
      setResult(null);
      setError('Ingresá valores numéricos positivos mayores que cero.');
      return;
    }

    if (qt < 100 || qt > 800) {
      setResult(null);
      setError('Revisá el QT ingresado. Usá milisegundos y un valor clínicamente plausible.');
      return;
    }

    if (rate < 20 || rate > 300) {
      setResult(null);
      setError('Revisá la frecuencia cardíaca ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    setError('');
    setResult(Math.round(calculateBazettQtc(qt, rate)));
  }

  function resetCalculator() {
    setQtMilliseconds('');
    setHeartRate('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Corrección del intervalo QT según la frecuencia cardíaca, para facilitar su interpretación clínica.
      </CalculatorInfo>

      <CalculatorFormula formulas={['RR = 60 / FC', 'QTc = QT / √RR']} />

      <label>
        QT
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setQtMilliseconds(event.target.value)}
            placeholder="400"
            type="number"
            value={qtMilliseconds}
          />
          <span>ms</span>
        </div>
      </label>

      <label>
        Frecuencia cardíaca
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setHeartRate(event.target.value)}
            placeholder="75"
            type="number"
            value={heartRate}
          />
          <span>lpm</span>
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
          <span>Resultado QTc Bazett</span>
          <strong>{result} ms</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <div className="calculator-interpretation-grid">
          <div>
            <strong>Varones</strong>
            <ul className="calculator-interpretation-list">
              <li>≤ 450 ms: dentro del rango habitualmente aceptado.</li>
              <li>451–479 ms: prolongación limítrofe o moderada.</li>
              <li>≥ 480 ms: prolongado.</li>
            </ul>
          </div>
          <div>
            <strong>Mujeres</strong>
            <ul className="calculator-interpretation-list">
              <li>≤ 460 ms: dentro del rango habitualmente aceptado.</li>
              <li>461–479 ms: prolongación limítrofe o moderada.</li>
              <li>≥ 480 ms: prolongado.</li>
            </ul>
          </div>
        </div>
        <p>QTc ≥ 500 ms se asocia con mayor riesgo de arritmias ventriculares y requiere valoración clínica.</p>
        <p>La fórmula de Bazett puede sobrecorregir con frecuencias cardíacas altas y subcorregir con frecuencias bajas.</p>
        <p>El resultado debe interpretarse junto con el ECG y el contexto clínico.</p>
      </CalculatorInterpretation>
    </form>
  );
}
