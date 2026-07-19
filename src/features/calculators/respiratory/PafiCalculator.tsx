import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculatePafiRatio } from './pafiRatio';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function PafiCalculator() {
  const [pao2, setPao2] = useState('');
  const [fio2Percent, setFio2Percent] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPao2 = parsePositiveNumber(pao2);
    const parsedFio2 = parsePositiveNumber(fio2Percent);

    if (parsedPao2 === null || parsedFio2 === null) {
      setResult(null);
      setError('Completá la PaO₂ y la FiO₂.');
      return;
    }

    if (!Number.isFinite(parsedPao2) || !Number.isFinite(parsedFio2) || parsedPao2 <= 0 || parsedFio2 <= 0) {
      setResult(null);
      setError('Ingresá valores numéricos positivos mayores que cero.');
      return;
    }

    if (parsedFio2 < 21 || parsedFio2 > 100) {
      setResult(null);
      setError('La FiO₂ debe ingresarse como porcentaje entre 21 y 100.');
      return;
    }

    if (parsedPao2 < 20 || parsedPao2 > 700) {
      setResult(null);
      setError('Revisá la PaO₂ ingresada. El valor parece estar fuera de un rango plausible.');
      return;
    }

    setError('');
    setResult(Math.round(calculatePafiRatio(parsedPao2, parsedFio2)));
  }

  function resetCalculator() {
    setPao2('');
    setFio2Percent('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Relación entre la presión arterial de oxígeno y la fracción inspirada de oxígeno. Se utiliza para valorar el grado de alteración de la oxigenación.
      </CalculatorInfo>

      <CalculatorFormula formulas={['PAFI = PaO₂ / FiO₂', 'FiO₂ se utiliza como fracción decimal']} />

      <label>
        PaO₂
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setPao2(event.target.value)}
            placeholder="80"
            type="number"
            value={pao2}
          />
          <span>mmHg</span>
        </div>
      </label>

      <label>
        FiO₂
        <div className="calculator-input-unit">
          <input
            inputMode="decimal"
            max="100"
            min="21"
            onChange={(event) => setFio2Percent(event.target.value)}
            placeholder="40"
            type="number"
            value={fio2Percent}
          />
          <span>%</span>
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
          <span>Resultado PAFI</span>
          <strong>{result} mmHg</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>&gt; 300 mmHg: oxigenación relativamente conservada.</li>
          <li>201–300 mmHg: alteración leve de la oxigenación.</li>
          <li>101–200 mmHg: alteración moderada de la oxigenación.</li>
          <li>≤ 100 mmHg: alteración grave de la oxigenación.</li>
        </ul>
        <p>Estos rangos coinciden con categorías de oxigenación utilizadas en la definición de SDRA, pero el valor PAFI aislado no diagnostica SDRA.</p>
        <p>
          Su interpretación requiere considerar, entre otros elementos: contexto clínico, tiempo de evolución, imágenes pulmonares,
          causa del edema, modalidad de soporte respiratorio y nivel de PEEP o CPAP.
        </p>
      </CalculatorInterpretation>
    </form>
  );
}
