import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import {
  calculatePediatricEndotrachealTubeSize,
  type PediatricEndotrachealTubeResult,
  type PediatricTubeType
} from './pediatricEndotrachealTube';

function parseAge(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatMillimeters(value: number) {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
}

export function PediatricEndotrachealTubeCalculator() {
  const [ageYears, setAgeYears] = useState('');
  const [tubeType, setTubeType] = useState<PediatricTubeType | ''>('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<PediatricEndotrachealTubeResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const age = parseAge(ageYears);

    if (age === null) {
      setResult(null);
      setError('Completá la edad en años.');
      return;
    }

    if (!Number.isFinite(age) || age < 0) {
      setResult(null);
      setError('Ingresá una edad válida mayor o igual a cero.');
      return;
    }

    if (age > 18) {
      setResult(null);
      setError('Esta calculadora está pensada para edad pediátrica. Ingresá una edad de hasta 18 años.');
      return;
    }

    if (!tubeType) {
      setResult(null);
      setError('Seleccioná si el tubo es con cuff o sin cuff.');
      return;
    }

    if (age < 2) {
      setResult(null);
      setError('Las fórmulas por edad utilizadas en esta calculadora están pensadas principalmente para niños de 2 años o más. En lactantes y recién nacidos, el tamaño debe seleccionarse mediante tablas específicas según edad, peso y contexto clínico.');
      return;
    }

    setError('');
    setResult(calculatePediatricEndotrachealTubeSize(age, tubeType));
  }

  function resetCalculator() {
    setAgeYears('');
    setTubeType('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Estimación orientativa del diámetro interno de un tubo endotraqueal pediátrico según la edad y según se utilice tubo con cuff o sin cuff.
      </CalculatorInfo>

      <CalculatorInfo title="Aclaración">
        La calculadora no afirma que el tamaño calculado será necesariamente el definitivo.
      </CalculatorInfo>

      <CalculatorFormula formulas={['Sin cuff: diámetro interno en mm = edad / 4 + 4', 'Con cuff: diámetro interno en mm = edad / 4 + 3,5']} />

      <label>
        Edad
        <div className="calculator-input-unit">
          <input inputMode="decimal" min="0" onChange={(event) => setAgeYears(event.target.value)} placeholder="6" type="number" value={ageYears} />
          <span>años</span>
        </div>
      </label>

      <fieldset className="calculator-option-group">
        <legend>Tipo de tubo</legend>
        <label>
          <input checked={tubeType === 'cuffed'} name="pediatric-ett-type" onChange={() => setTubeType('cuffed')} type="radio" />
          Con cuff
        </label>
        <label>
          <input checked={tubeType === 'uncuffed'} name="pediatric-ett-type" onChange={() => setTubeType('uncuffed')} type="radio" />
          Sin cuff
        </label>
      </fieldset>

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
          <span>Tamaño calculado exacto</span>
          <strong>{formatMillimeters(result.exactSize)} mm</strong>
          <span>Tamaño comercial sugerido</span>
          <strong>{formatMillimeters(result.suggestedSize)} mm</strong>
          <span>Alternativa menor</span>
          <strong>{formatMillimeters(result.smallerSize)} mm</strong>
          <span>Alternativa mayor</span>
          <strong>{formatMillimeters(result.largerSize)} mm</strong>
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>El resultado es una estimación inicial.</li>
          <li>Deben estar disponibles tubos 0,5 mm menores y mayores.</li>
          <li>Confirmar el tamaño mediante ventilación adecuada, fuga apropiada y presión del cuff cuando corresponda.</li>
          <li>Confirmar la posición mediante capnografía, auscultación, expansión torácica y demás controles clínicos.</li>
          <li>No utilizar solamente la profundidad marcada en el tubo para confirmar posición.</li>
          <li>En tubos con cuff debe controlarse la presión del cuff.</li>
          <li>El resultado no reemplaza la valoración de la vía aérea ni el criterio profesional.</li>
        </ul>
      </CalculatorInterpretation>
    </form>
  );
}
