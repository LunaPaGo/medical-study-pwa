import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateFractionalExcretionOfSodium } from './fractionalExcretionOfSodium';

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

export function FenaCalculator() {
  const [plasmaSodium, setPlasmaSodium] = useState('');
  const [urineSodium, setUrineSodium] = useState('');
  const [plasmaCreatinine, setPlasmaCreatinine] = useState('');
  const [urineCreatinine, setUrineCreatinine] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPlasmaSodium = parsePositiveNumber(plasmaSodium);
    const parsedUrineSodium = parsePositiveNumber(urineSodium);
    const parsedPlasmaCreatinine = parsePositiveNumber(plasmaCreatinine);
    const parsedUrineCreatinine = parsePositiveNumber(urineCreatinine);

    if (
      parsedPlasmaSodium === null ||
      parsedUrineSodium === null ||
      parsedPlasmaCreatinine === null ||
      parsedUrineCreatinine === null
    ) {
      setResult(null);
      setError('Completá todos los valores plasmáticos y urinarios.');
      return;
    }

    const values = [parsedPlasmaSodium, parsedUrineSodium, parsedPlasmaCreatinine, parsedUrineCreatinine];
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      setResult(null);
      setError('Todos los valores deben ser numéricos y mayores que cero.');
      return;
    }

    if (parsedPlasmaSodium < 80 || parsedPlasmaSodium > 190) {
      setResult(null);
      setError('Revisá el sodio plasmático ingresado. El valor parece estar fuera de un rango plausible.');
      return;
    }

    if (parsedUrineSodium > 300) {
      setResult(null);
      setError('Revisá el sodio urinario ingresado. El valor parece estar fuera de un rango plausible.');
      return;
    }

    if (parsedPlasmaCreatinine > 30 || parsedUrineCreatinine > 5000) {
      setResult(null);
      setError('Revisá las creatininas ingresadas. Algún valor parece estar fuera de un rango plausible.');
      return;
    }

    setError('');
    setResult(
      calculateFractionalExcretionOfSodium(
        parsedPlasmaSodium,
        parsedUrineSodium,
        parsedPlasmaCreatinine,
        parsedUrineCreatinine
      )
    );
  }

  function resetCalculator() {
    setPlasmaSodium('');
    setUrineSodium('');
    setPlasmaCreatinine('');
    setUrineCreatinine('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Porcentaje del sodio filtrado por el glomérulo que finalmente se excreta en la orina. Se utiliza como dato complementario en la evaluación de pacientes con lesión renal aguda.
      </CalculatorInfo>

      <CalculatorFormula
        formulas={[
          'FENa (%) = (sodio urinario × creatinina plasmática) / (sodio plasmático × creatinina urinaria) × 100'
        ]}
      />

      <label>
        Sodio plasmático
        <div className="calculator-input-unit">
          <input inputMode="decimal" min="0" onChange={(event) => setPlasmaSodium(event.target.value)} placeholder="140" type="number" value={plasmaSodium} />
          <span>mEq/L</span>
        </div>
      </label>

      <label>
        Sodio urinario
        <div className="calculator-input-unit">
          <input inputMode="decimal" min="0" onChange={(event) => setUrineSodium(event.target.value)} placeholder="20" type="number" value={urineSodium} />
          <span>mEq/L</span>
        </div>
      </label>

      <label>
        Creatinina plasmática
        <div className="calculator-input-unit">
          <input inputMode="decimal" min="0" onChange={(event) => setPlasmaCreatinine(event.target.value)} placeholder="2" type="number" value={plasmaCreatinine} />
          <span>mg/dL</span>
        </div>
      </label>

      <label>
        Creatinina urinaria
        <div className="calculator-input-unit">
          <input inputMode="decimal" min="0" onChange={(event) => setUrineCreatinine(event.target.value)} placeholder="100" type="number" value={urineCreatinine} />
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
          <span>Resultado FENa</span>
          <strong>{formatPercent(result)} %</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>&lt;1 %: compatible con retención renal de sodio. Puede observarse en estados prerrenales.</li>
          <li>1–2 %: zona intermedia. Interpretación limitada.</li>
          <li>&gt;2 %: puede sugerir alteración tubular o lesión renal intrínseca.</li>
        </ul>
        <p>No determina por sí sola la causa de la lesión renal aguda.</p>
        <p>Puede perder utilidad en pacientes que reciben diuréticos.</p>
        <p>También puede ser engañosa en enfermedad renal crónica, glomerulopatías, sepsis, obstrucción urinaria y algunas lesiones renales intrínsecas.</p>
        <p>Los valores plasmáticos y urinarios deberían provenir de muestras obtenidas en momentos próximos.</p>
        <p>Interpretar junto con volemia, diuresis, sedimento urinario, creatinina y contexto clínico.</p>
      </CalculatorInterpretation>
    </form>
  );
}
