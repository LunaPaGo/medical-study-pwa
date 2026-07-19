import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateCorrectedSodium, type CorrectedSodiumResult } from './correctedSodium';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatOneDecimal(value: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
}

export function CorrectedSodiumCalculator() {
  const [measuredSodium, setMeasuredSodium] = useState('');
  const [glucose, setGlucose] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CorrectedSodiumResult | null>(null);
  const [note, setNote] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sodium = parsePositiveNumber(measuredSodium);
    const parsedGlucose = parsePositiveNumber(glucose);

    if (sodium === null || parsedGlucose === null) {
      setResult(null);
      setNote('');
      setError('Completá el sodio medido y la glucemia.');
      return;
    }

    if (!Number.isFinite(sodium) || !Number.isFinite(parsedGlucose) || sodium <= 0 || parsedGlucose <= 0) {
      setResult(null);
      setNote('');
      setError('Ingresá valores numéricos positivos mayores que cero.');
      return;
    }

    if (sodium < 80 || sodium > 190) {
      setResult(null);
      setNote('');
      setError('Revisá el sodio medido ingresado. El valor parece estar fuera de un rango plausible.');
      return;
    }

    if (parsedGlucose < 20 || parsedGlucose > 1500) {
      setResult(null);
      setNote('');
      setError('Revisá la glucemia ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    setError('');
    setResult(calculateCorrectedSodium(sodium, parsedGlucose));
    setNote(
      parsedGlucose <= 100
        ? 'No se aplicó corrección por hiperglucemia porque la glucemia es igual o menor de 100 mg/dL.'
        : ''
    );
  }

  function resetCalculator() {
    setMeasuredSodium('');
    setGlucose('');
    setError('');
    setResult(null);
    setNote('');
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Estimación de la concentración de sodio plasmático corregida frente al descenso aparente del sodio producido por la hiperglucemia.
      </CalculatorInfo>

      <CalculatorInfo title="Aclaración">
        La hiperglucemia aumenta la osmolaridad extracelular y desplaza agua desde el espacio intracelular, lo que puede disminuir de manera transitoria la concentración medida de sodio.
      </CalculatorInfo>

      <CalculatorFormula formulas={['Sodio corregido = sodio medido + 1,6 × [(glucemia − 100) / 100]', 'La corrección se aplica solo cuando la glucemia es mayor de 100 mg/dL.']} />

      <label>
        Sodio medido
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setMeasuredSodium(event.target.value)}
            placeholder="130"
            type="number"
            value={measuredSodium}
          />
          <span>mEq/L</span>
        </div>
      </label>

      <label>
        Glucemia
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setGlucose(event.target.value)}
            placeholder="500"
            type="number"
            value={glucose}
          />
          <span>mg/dL</span>
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
          <span>Sodio medido</span>
          <strong>{formatOneDecimal(Number(measuredSodium.replace(',', '.')))} mEq/L</strong>
          <span>Corrección agregada</span>
          <strong>{formatOneDecimal(result.correction)} mEq/L</strong>
          <span>Sodio corregido</span>
          <strong>{formatOneDecimal(result.correctedSodium)} mEq/L</strong>
          {note && <p>{note}</p>}
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>&lt;135 mEq/L: hiponatremia persistente luego de corregir por glucemia.</li>
          <li>135–145 mEq/L: rango habitual de referencia en adultos.</li>
          <li>&gt;145 mEq/L: hipernatremia luego de corregir por glucemia.</li>
        </ul>
        <p>El sodio corregido es una estimación.</p>
        <p>No reemplaza la evaluación de osmolaridad, volumen circulante, función renal ni estado clínico.</p>
        <p>
          En hiperglucemias muy marcadas pueden utilizarse factores de corrección diferentes, como 2,4 mEq/L por cada 100 mg/dL
          de glucosa por encima de 100.
        </p>
        <p>Esta calculadora no alterna automáticamente entre factores: utiliza exclusivamente el factor 1,6.</p>
      </CalculatorInterpretation>
    </form>
  );
}
