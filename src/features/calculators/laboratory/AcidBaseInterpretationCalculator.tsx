import { type FormEvent, useState } from 'react';
import { CalculatorInfo } from '../components/CalculatorInfo';
import {
  HENDERSON_HASSELBALCH_WARNING_THRESHOLD,
  interpretAcidBase,
  type AcidBaseInterpretationResult,
  type RespiratoryTemporality
} from './acidBaseInterpretation';

type NumericField = 'pH' | 'PaCO₂' | 'HCO₃⁻' | 'Na⁺' | 'Cl⁻' | 'albúmina';

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateRequired(value: number | null, field: NumericField, max: number) {
  if (value === null) return `Completá ${field}.`;
  if (!Number.isFinite(value) || value <= 0 || value > max) return `Revisá ${field}: ingresá un valor numérico mayor que 0 y no mayor que ${max}.`;
  return '';
}

function validateOptional(value: number | null, field: NumericField, max: number) {
  if (value === null) return '';
  if (!Number.isFinite(value) || value <= 0 || value > max) return `Revisá ${field}: ingresá un valor numérico mayor que 0 y no mayor que ${max}.`;
  return '';
}

function format(value: number, digits = 1) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function RangeValue({ min, max, unit }: { min: number; max: number; unit: string }) {
  return <strong>{format(min)}–{format(max)} {unit}</strong>;
}

export function AcidBaseInterpretationCalculator() {
  const [ph, setPh] = useState('');
  const [paco2, setPaco2] = useState('');
  const [bicarbonate, setBicarbonate] = useState('');
  const [sodium, setSodium] = useState('');
  const [chloride, setChloride] = useState('');
  const [albumin, setAlbumin] = useState('');
  const [temporality, setTemporality] = useState<RespiratoryTemporality>('unknown');
  const [error, setError] = useState('');
  const [optionalNotice, setOptionalNotice] = useState('');
  const [result, setResult] = useState<AcidBaseInterpretationResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      ph: parseNumber(ph),
      paco2: parseNumber(paco2),
      bicarbonate: parseNumber(bicarbonate),
      sodium: parseNumber(sodium),
      chloride: parseNumber(chloride),
      albumin: parseNumber(albumin)
    };
    const validationError =
      validateRequired(values.ph, 'pH', 8.5) ||
      (values.ph !== null && values.ph < 6 ? 'Revisá pH: el valor debe ser al menos 6.' : '') ||
      validateRequired(values.paco2, 'PaCO₂', 250) ||
      validateRequired(values.bicarbonate, 'HCO₃⁻', 100) ||
      validateOptional(values.sodium, 'Na⁺', 250) ||
      validateOptional(values.chloride, 'Cl⁻', 250) ||
      validateOptional(values.albumin, 'albúmina', 10);

    if (validationError || values.ph === null || values.paco2 === null || values.bicarbonate === null) {
      setError(validationError || 'Completá pH, PaCO₂ y HCO₃⁻.');
      setResult(null);
      setOptionalNotice('');
      return;
    }

    setError('');
    setOptionalNotice(
      (values.sodium === null) !== (values.chloride === null)
        ? 'El anion gap no se calculó porque Na⁺ y Cl⁻ deben ingresarse conjuntamente.'
        : values.albumin !== null && (values.sodium === null || values.chloride === null)
          ? 'La albúmina no se utilizó porque faltan Na⁺ y Cl⁻ para calcular el anion gap.'
          : ''
    );
    setResult(interpretAcidBase({
      ph: values.ph,
      paco2: values.paco2,
      bicarbonate: values.bicarbonate,
      sodium: values.sodium ?? undefined,
      chloride: values.chloride ?? undefined,
      albumin: values.albumin ?? undefined,
      respiratoryTemporality: temporality
    }));
  }

  function resetCalculator() {
    setPh('');
    setPaco2('');
    setBicarbonate('');
    setSodium('');
    setChloride('');
    setAlbumin('');
    setTemporality('unknown');
    setError('');
    setOptionalNotice('');
    setResult(null);
  }

  return (
    <form className="calculator-form acid-base-calculator" onSubmit={handleSubmit}>
      <CalculatorInfo title="Qué representa">
        Interpretación fisiológica sistemática de pH, PaCO₂ y HCO₃⁻, con evaluación de compensación, trastornos concomitantes y cálculos complementarios cuando existen los datos necesarios.
      </CalculatorInfo>

      <div className="acid-base-input-grid">
        <label>pH<input inputMode="decimal" min="6" max="8.5" step="any" onChange={(event) => setPh(event.target.value)} placeholder="7,40" type="number" value={ph} /></label>
        <label>PaCO₂<div className="calculator-input-unit"><input inputMode="decimal" min="0" step="any" onChange={(event) => setPaco2(event.target.value)} placeholder="40" type="number" value={paco2} /><span>mmHg</span></div></label>
        <label>HCO₃⁻<div className="calculator-input-unit"><input inputMode="decimal" min="0" step="any" onChange={(event) => setBicarbonate(event.target.value)} placeholder="24" type="number" value={bicarbonate} /><span>mEq/L</span></div></label>
      </div>

      <label>Temporalidad respiratoria<select value={temporality} onChange={(event) => setTemporality(event.target.value as RespiratoryTemporality)}><option value="unknown">No conocida</option><option value="acute">Aguda</option><option value="chronic">Crónica</option></select></label>

      <fieldset className="acid-base-optional-fields">
        <legend>Datos opcionales para anion gap</legend>
        <div className="acid-base-input-grid">
          <label>Na⁺<div className="calculator-input-unit"><input inputMode="decimal" min="0" step="any" onChange={(event) => setSodium(event.target.value)} placeholder="140" type="number" value={sodium} /><span>mEq/L</span></div></label>
          <label>Cl⁻<div className="calculator-input-unit"><input inputMode="decimal" min="0" step="any" onChange={(event) => setChloride(event.target.value)} placeholder="104" type="number" value={chloride} /><span>mEq/L</span></div></label>
          <label>Albúmina<div className="calculator-input-unit"><input inputMode="decimal" min="0" step="any" onChange={(event) => setAlbumin(event.target.value)} placeholder="4" type="number" value={albumin} /><span>g/dL</span></div></label>
        </div>
      </fieldset>

      {error && <div className="notice warning">{error}</div>}
      <div className="calculator-actions"><button className="primary-button" type="submit">Calcular</button><button className="ghost-button" type="button" onClick={resetCalculator}>Reiniciar</button></div>

      {result && !error && (
        <div className="acid-base-results" aria-live="polite">
          <section className="calculator-result acid-base-summary">
            <span>Interpretación</span><strong>{result.headline}</strong>
            {result.processes.length > 0 ? <div className="acid-base-process-list">{result.processes.map((process, index) => <div key={process.type}>{index > 0 && <b aria-hidden="true">+</b>}<span>{process.label}</span></div>)}</div> : <p>No se identifican procesos adicionales mediante las reglas de esta versión.</p>}
          </section>

          <div className="acid-base-result-grid">
            <section className="calculator-info-block"><span>Estado del pH</span><strong>pH: {format(Number(ph.replace(',', '.')), 2)}</strong><p>{result.phLabel}</p></section>
            <section className="calculator-info-block"><span>Componente metabólico</span><strong>HCO₃⁻: {format(Number(bicarbonate.replace(',', '.')))} mEq/L</strong><p>{result.metabolicStatus === 'low' ? 'Disminuido' : result.metabolicStatus === 'high' ? 'Elevado' : 'En la referencia matemática de 24 mEq/L'}</p></section>
          </div>

          {result.compensation && <section className="calculator-info-block acid-base-compensation"><span>Compensación</span><p>{result.compensation.measuredVariable} medida: <strong>{format(result.compensation.measuredValue)} {result.compensation.measuredVariable === 'PaCO₂' ? 'mmHg' : 'mEq/L'}</strong></p>{result.compensation.acuteExpected && result.compensation.chronicExpected ? <div className="acid-base-range-grid"><p>Modelo agudo<br /><RangeValue {...result.compensation.acuteExpected} unit="mEq/L" /></p><p>Modelo crónico<br /><RangeValue {...result.compensation.chronicExpected} unit="mEq/L" /></p></div> : <p>Intervalo esperado: <RangeValue {...result.compensation.expected} unit="mmHg" /></p>}<p>{result.compensation.interpretation}</p></section>}

          {result.anionGap && <section className="calculator-info-block"><span>Anion gap</span><p>AG medido: <strong>{format(result.anionGap.measured)} mEq/L</strong></p>{result.anionGap.corrected !== null && <p>AG corregido por albúmina: <strong>{format(result.anionGap.corrected)} mEq/L</strong></p>}<p>Referencia matemática usada por el algoritmo: 12 mEq/L. El intervalo normal depende del laboratorio y del método.</p></section>}

          {result.delta && <section className="calculator-info-block"><span>Delta</span><div className="acid-base-result-grid"><p>Delta gap<br /><strong>{format(result.delta.deltaGap)} mEq/L</strong></p><p>HCO₃⁻ corregido<br /><strong>{format(result.delta.correctedBicarbonate)} mEq/L</strong></p><p>Delta ratio<br /><strong>{result.delta.ratio === null ? 'No calculable' : format(result.delta.ratio, 2)}</strong></p></div>{result.delta.interpretation && <p>{result.delta.interpretation}</p>}<p>Estos cálculos son orientativos y no establecen una etiología.</p></section>}

          {optionalNotice && <div className="notice warning">{optionalNotice}</div>}
          {result.coherence.warning && <div className="notice warning"><strong>Revisar coherencia interna.</strong> Los valores ingresados de pH, PaCO₂ y HCO₃⁻ no parecen internamente concordantes. Verificá que correspondan a la misma muestra y que el bicarbonato ingresado sea el apropiado.</div>}

          <details className="calculator-info-block acid-base-calculation-details"><summary>Cómo se calculó</summary><div><p>pH estimado por Henderson-Hasselbalch: {format(result.coherence.estimatedPh, 3)}. Diferencia respecto del pH ingresado: {format(result.coherence.difference, 3)}.</p><p>El aviso de coherencia se activa cuando la diferencia supera {format(HENDERSON_HASSELBALCH_WARNING_THRESHOLD, 2)} unidades de pH.</p><ul className="calculator-interpretation-list">{result.calculationSteps.map((step) => <li key={step}>{step}</li>)}</ul>{result.notes.map((note) => <p key={note}>{note}</p>)}</div></details>
        </div>
      )}

      <CalculatorInfo title="Alcance clínico">
        La calculadora interpreta la fisiología ácido-base y no diagnostica la etiología. Los resultados deben correlacionarse con la muestra, el laboratorio, la evolución y el contexto clínico.
      </CalculatorInfo>
    </form>
  );
}
