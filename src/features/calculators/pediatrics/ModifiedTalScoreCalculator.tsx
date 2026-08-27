import { FormEvent, useState } from 'react';
import { CalculatorInfo } from '../components/CalculatorInfo';
import { calculateModifiedTalScore } from './modifiedTalScore';
import type {
  ModifiedTalScoreResult,
  TalAgeGroup,
  TalRetractions,
  TalWheezing
} from './modifiedTalScore.types';

function parseFrequency(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function ModifiedTalScoreCalculator() {
  const [ageGroup, setAgeGroup] = useState<TalAgeGroup | ''>('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [wheezing, setWheezing] = useState<TalWheezing | ''>('');
  const [retractions, setRetractions] = useState<TalRetractions | ''>('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ModifiedTalScoreResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedHeartRate = parseFrequency(heartRate);
    const parsedRespiratoryRate = parseFrequency(respiratoryRate);

    if (!ageGroup || parsedHeartRate === null || parsedRespiratoryRate === null || wheezing === '' || retractions === '') {
      setResult(null);
      setError('Completá todos los campos con valores válidos no negativos.');
      return;
    }

    setError('');
    setResult(
      calculateModifiedTalScore({
        ageGroup,
        heartRate: parsedHeartRate,
        respiratoryRate: parsedRespiratoryRate,
        wheezing,
        retractions
      })
    );
  }

  function resetCalculator() {
    setAgeGroup('');
    setHeartRate('');
    setRespiratoryRate('');
    setWheezing('');
    setRetractions('');
    setError('');
    setResult(null);
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Valoración de la gravedad de la obstrucción bronquial mediante el Puntaje de Tal modificado.
      </CalculatorInfo>

      <label>
        Edad
        <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value as TalAgeGroup | '')}>
          <option value="">Seleccionar</option>
          <option value="underSixMonths">Menor de 6 meses</option>
          <option value="sixMonthsOrOlder">6 meses o más</option>
        </select>
      </label>

      <label>
        Frecuencia cardíaca
        <div className="calculator-input-unit">
          <input inputMode="numeric" min="0" onChange={(event) => setHeartRate(event.target.value)} placeholder="130" type="number" value={heartRate} />
          <span>latidos/min</span>
        </div>
      </label>

      <label>
        Frecuencia respiratoria
        <div className="calculator-input-unit">
          <input inputMode="numeric" min="0" onChange={(event) => setRespiratoryRate(event.target.value)} placeholder="50" type="number" value={respiratoryRate} />
          <span>respiraciones/min</span>
        </div>
      </label>

      <label>
        Sibilancias
        <select value={wheezing} onChange={(event) => setWheezing(event.target.value === '' ? '' : (Number(event.target.value) as TalWheezing))}>
          <option value="">Seleccionar</option>
          <option value="0">No</option>
          <option value="1">Al final de la espiración</option>
          <option value="2">Inspiración y espiración</option>
          <option value="3">Audibles sin estetoscopio</option>
        </select>
      </label>

      <label>
        Uso de músculos accesorios / retracciones
        <select value={retractions} onChange={(event) => setRetractions(event.target.value === '' ? '' : (Number(event.target.value) as TalRetractions))}>
          <option value="">Seleccionar</option>
          <option value="0">No</option>
          <option value="1">Tiraje intercostal leve</option>
          <option value="2">Tiraje generalizado</option>
          <option value="3">Tiraje generalizado + aleteo nasal</option>
        </select>
      </label>

      <div className="notice warning">
        Si no se auscultan sibilancias debido a una entrada de aire muy disminuida, considerar 3 puntos.
      </div>

      {error && <div className="notice warning">{error}</div>}

      <div className="calculator-actions">
        <button className="primary-button" type="submit">Calcular</button>
        <button className="ghost-button" type="button" onClick={resetCalculator}>Reiniciar</button>
      </div>

      {result && !error && (
        <div className="calculator-result" aria-live="polite">
          <span>Puntaje de Tal</span>
          <strong>{result.total} / 12</strong>
          <span>Gravedad</span>
          <strong>{result.severity}</strong>
          <span>Frecuencia cardíaca</span>
          <strong>{result.breakdown.heartRate} puntos</strong>
          <span>Frecuencia respiratoria</span>
          <strong>{result.breakdown.respiratoryRate} puntos</strong>
          <span>Sibilancias</span>
          <strong>{result.breakdown.wheezing} puntos</strong>
          <span>Retracciones</span>
          <strong>{result.breakdown.retractions} puntos</strong>
          <span>Total</span>
          <strong>{result.total} / 12</strong>
        </div>
      )}

      <CalculatorInfo title="Nota clínica">
        <p>El Puntaje de Tal modificado es una herramienta clínica para valorar la gravedad de la obstrucción bronquial y debe interpretarse junto con la evaluación clínica y la saturación de oxígeno.</p>
        <p>En ausencia de sibilancias por entrada de aire marcadamente disminuida, considerar 3 puntos en ese componente.</p>
        <p>Fuente: Sociedad Argentina de Pediatría — recomendaciones para el manejo de infecciones respiratorias agudas bajas.</p>
      </CalculatorInfo>
    </form>
  );
}
