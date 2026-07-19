import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateDevineIdealBodyWeight, type DevineSex } from './devineIdealBodyWeight';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatWeight(value: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
}

export function IdealBodyWeightCalculator() {
  const [sex, setSex] = useState<DevineSex | ''>('');
  const [heightCentimeters, setHeightCentimeters] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const height = parsePositiveNumber(heightCentimeters);

    if (!sex) {
      setResult(null);
      setError('Seleccioná el sexo utilizado por la fórmula.');
      return;
    }

    if (height === null) {
      setResult(null);
      setError('Completá la altura en centímetros.');
      return;
    }

    if (!Number.isFinite(height) || height <= 0) {
      setResult(null);
      setError('Ingresá una altura numérica positiva mayor que cero.');
      return;
    }

    if (height < 80 || height > 250) {
      setResult(null);
      setError('Revisá la altura ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    if (height <= 152.4) {
      setResult(null);
      setError('La fórmula de Devine fue diseñada para alturas superiores a 5 pies. El resultado puede no ser apropiado.');
      return;
    }

    setError('');
    setResult(calculateDevineIdealBodyWeight(sex, height));
  }

  function resetCalculator() {
    setSex('');
    setHeightCentimeters('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Estimación del peso corporal ideal utilizada como referencia en determinados cálculos clínicos y para la dosificación de algunos medicamentos.
      </CalculatorInfo>

      <CalculatorInfo title="Aclaración">
        No representa necesariamente el peso saludable real del paciente ni debe utilizarse de forma aislada como objetivo nutricional.
      </CalculatorInfo>

      <CalculatorFormula
        formulas={[
          'Varones: Peso ideal = 50 kg + 2,3 kg por cada pulgada por encima de 5 pies',
          'Mujeres: Peso ideal = 45,5 kg + 2,3 kg por cada pulgada por encima de 5 pies',
          'Pulgadas por encima de 5 pies = (altura en cm − 152,4) / 2,54'
        ]}
      />

      <fieldset className="calculator-option-group">
        <legend>Sexo para la fórmula</legend>
        <label>
          <input checked={sex === 'male'} name="devine-sex" onChange={() => setSex('male')} type="radio" />
          Varón
        </label>
        <label>
          <input checked={sex === 'female'} name="devine-sex" onChange={() => setSex('female')} type="radio" />
          Mujer
        </label>
      </fieldset>

      <label>
        Altura
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setHeightCentimeters(event.target.value)}
            placeholder="170"
            type="number"
            value={heightCentimeters}
          />
          <span>cm</span>
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
          <span>Resultado peso ideal</span>
          <strong>{formatWeight(result)} kg</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>Es una estimación basada exclusivamente en altura y sexo utilizado por la fórmula.</li>
          <li>Puede emplearse como referencia para determinadas dosis y parámetros clínicos.</li>
          <li>No equivale al peso magro, peso ajustado ni peso corporal predicho.</li>
          <li>La elección del peso para dosificar un medicamento depende del fármaco y del contexto clínico.</li>
        </ul>
      </CalculatorInterpretation>
    </form>
  );
}
