import { FormEvent, useState } from 'react';
import { CalculatorFormula } from '../components/CalculatorFormula';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { CalculatorInterpretation } from '../components/CalculatorInterpretation';
import { calculateGlasgowComaScale, type GlasgowComaScaleResult } from './glasgowComaScale';

const ocularOptions = [
  { label: 'Espontánea', value: 4 },
  { label: 'A la voz', value: 3 },
  { label: 'Al estímulo doloroso', value: 2 },
  { label: 'Ninguna', value: 1 }
];

const verbalOptions = [
  { label: 'Orientada', value: 5 },
  { label: 'Confusa', value: 4 },
  { label: 'Palabras inapropiadas', value: 3 },
  { label: 'Sonidos incomprensibles', value: 2 },
  { label: 'Ninguna', value: 1 }
];

const motorOptions = [
  { label: 'Obedece órdenes', value: 6 },
  { label: 'Localiza el estímulo doloroso', value: 5 },
  { label: 'Retirada ante el dolor', value: 4 },
  { label: 'Flexión anormal', value: 3 },
  { label: 'Extensión anormal', value: 2 },
  { label: 'Ninguna', value: 1 }
];

export function GlasgowComaScaleCalculator() {
  const [ocular, setOcular] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const [isIntubated, setIsIntubated] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GlasgowComaScaleResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (ocular === null || motor === null || (!isIntubated && verbal === null)) {
      setResult(null);
      setError('Seleccioná una respuesta ocular, verbal y motora, o indicá si la respuesta verbal no es evaluable.');
      return;
    }

    setError('');
    setResult(calculateGlasgowComaScale({ ocular, motor, verbal: isIntubated ? 'intubated' : verbal! }));
  }

  function resetCalculator() {
    setOcular(null);
    setVerbal(null);
    setMotor(null);
    setIsIntubated(false);
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Evaluación estandarizada del nivel de conciencia mediante la mejor respuesta ocular, verbal y motora.
      </CalculatorInfo>

      <CalculatorFormula formulas={['Glasgow total = ocular + verbal + motora', 'Registrar siempre E, V y M por separado']} />

      <fieldset className="calculator-option-group">
        <legend>Apertura ocular</legend>
        {ocularOptions.map((option) => (
          <label key={option.value}>
            <input checked={ocular === option.value} name="gcs-ocular" onChange={() => setOcular(option.value)} type="radio" />
            {option.label} — {option.value} puntos
          </label>
        ))}
      </fieldset>

      <fieldset className="calculator-option-group">
        <legend>Respuesta verbal</legend>
        <label>
          <input
            checked={isIntubated}
            onChange={(event) => {
              setIsIntubated(event.target.checked);
              if (event.target.checked) setVerbal(null);
            }}
            type="checkbox"
          />
          Paciente intubado / respuesta verbal no evaluable
        </label>
        {!isIntubated &&
          verbalOptions.map((option) => (
            <label key={option.value}>
              <input checked={verbal === option.value} name="gcs-verbal" onChange={() => setVerbal(option.value)} type="radio" />
              {option.label} — {option.value} puntos
            </label>
          ))}
      </fieldset>

      <fieldset className="calculator-option-group">
        <legend>Respuesta motora</legend>
        {motorOptions.map((option) => (
          <label key={option.value}>
            <input checked={motor === option.value} name="gcs-motor" onChange={() => setMotor(option.value)} type="radio" />
            {option.label} — {option.value} puntos
          </label>
        ))}
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
          <span>Notación</span>
          <strong>{result.notation}</strong>
          {typeof result.total === 'number' ? (
            <>
              <span>Glasgow total</span>
              <strong>GCS {result.total}/15</strong>
            </>
          ) : (
            <>
              <span>Subtotal ocular + motor</span>
              <strong>{result.subtotal}</strong>
              <p>La respuesta verbal no es evaluable. No se presenta un Glasgow total convencional de 3 a 15.</p>
            </>
          )}
        </div>
      )}

      <CalculatorInterpretation>
        <ul className="calculator-interpretation-list">
          <li>13–15: compromiso leve o nivel de conciencia relativamente conservado.</li>
          <li>9–12: compromiso moderado.</li>
          <li>3–8: compromiso grave.</li>
        </ul>
        <p>La puntuación total no debe interpretarse sin revisar sus tres componentes.</p>
        <p>Registrar siempre E, V y M por separado.</p>
        <p>Sedación, intoxicaciones, bloqueo neuromuscular, intubación, afasia, trauma facial y alteraciones sensoriales pueden impedir una evaluación válida.</p>
        <p>Un valor bajo no indica automáticamente una única conducta ni reemplaza la valoración de la vía aérea.</p>
        <p>La escala debe evaluarse de forma seriada para valorar tendencias.</p>
      </CalculatorInterpretation>
    </form>
  );
}
