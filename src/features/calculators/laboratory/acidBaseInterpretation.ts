export const ACID_BASE_REFERENCE = {
  phLow: 7.35,
  phHigh: 7.45,
  paco2: 40,
  bicarbonate: 24,
  anionGap: 12
} as const;

export const HENDERSON_HASSELBALCH_WARNING_THRESHOLD = 0.05;

export type RespiratoryTemporality = 'unknown' | 'acute' | 'chronic';
export type PhStatus = 'acidemia' | 'reference' | 'alkalemia';
export type AcidBaseProcessType =
  | 'metabolic-acidosis'
  | 'high-gap-metabolic-acidosis'
  | 'non-high-gap-metabolic-acidosis'
  | 'metabolic-alkalosis'
  | 'respiratory-acidosis'
  | 'respiratory-alkalosis';

export type AcidBaseProcess = {
  type: AcidBaseProcessType;
  label: string;
  role: 'primary' | 'concomitant';
};

export type NumericRange = {
  min: number;
  max: number;
  central?: number;
};

export type CompensationResult = {
  disorder: 'metabolic-acidosis' | 'metabolic-alkalosis' | 'respiratory-acidosis' | 'respiratory-alkalosis';
  measuredVariable: 'PaCO₂' | 'HCO₃⁻';
  measuredValue: number;
  expected: NumericRange;
  acuteExpected?: NumericRange;
  chronicExpected?: NumericRange;
  status: 'appropriate' | 'above' | 'below' | 'acute' | 'chronic' | 'both' | 'unexplained';
  interpretation: string;
};

export type AnionGapResult = {
  measured: number;
  corrected: number | null;
  used: number;
  usedCorrected: boolean;
  elevated: boolean;
};

export type DeltaResult = {
  deltaGap: number;
  correctedBicarbonate: number;
  ratio: number | null;
  interpretation: string | null;
};

export type CoherenceResult = {
  estimatedPh: number;
  difference: number;
  warning: boolean;
};

export type AcidBaseInput = {
  ph: number;
  paco2: number;
  bicarbonate: number;
  sodium?: number;
  chloride?: number;
  albumin?: number;
  respiratoryTemporality: RespiratoryTemporality;
};

export type AcidBaseInterpretationResult = {
  phStatus: PhStatus;
  phLabel: string;
  metabolicStatus: 'low' | 'reference' | 'high';
  processes: AcidBaseProcess[];
  classification: 'none' | 'simple' | 'mixed' | 'indeterminate';
  headline: string;
  compensation: CompensationResult | null;
  anionGap: AnionGapResult | null;
  delta: DeltaResult | null;
  coherence: CoherenceResult;
  calculationSteps: string[];
  notes: string[];
};

function inRange(value: number, range: NumericRange) {
  return value >= range.min && value <= range.max;
}

function addProcess(processes: AcidBaseProcess[], process: AcidBaseProcess) {
  if (!processes.some((item) => item.type === process.type)) processes.push(process);
}

function classifyPh(ph: number): { status: PhStatus; label: string } {
  if (ph < ACID_BASE_REFERENCE.phLow) return { status: 'acidemia', label: 'Acidemia' };
  if (ph > ACID_BASE_REFERENCE.phHigh) return { status: 'alkalemia', label: 'Alcalemia' };
  return { status: 'reference', label: 'Dentro del intervalo de referencia' };
}

export function calculateWinterRange(bicarbonate: number): NumericRange {
  const central = 1.5 * bicarbonate + 8;
  return { min: central - 2, max: central + 2, central };
}

export function calculateMetabolicAlkalosisCompensation(bicarbonate: number): NumericRange {
  const delta = bicarbonate - ACID_BASE_REFERENCE.bicarbonate;
  return {
    min: ACID_BASE_REFERENCE.paco2 + 0.6 * delta,
    max: ACID_BASE_REFERENCE.paco2 + 0.75 * delta
  };
}

export function calculateRespiratoryAcidosisRanges(paco2: number) {
  const delta = (paco2 - ACID_BASE_REFERENCE.paco2) / 10;
  return {
    acute: { min: 24 + delta, max: 24 + 2 * delta },
    chronic: { min: 24 + 3 * delta, max: 24 + 4 * delta }
  };
}

export function calculateRespiratoryAlkalosisRanges(paco2: number) {
  const delta = (ACID_BASE_REFERENCE.paco2 - paco2) / 10;
  const acuteValues = [24 - delta, 24 - 2 * delta];
  const chronicValues = [24 - 4 * delta, 24 - 5 * delta];
  return {
    acute: { min: Math.min(...acuteValues), max: Math.max(...acuteValues) },
    chronic: { min: Math.min(...chronicValues), max: Math.max(...chronicValues) }
  };
}

function evaluateRespiratoryCompensation(
  disorder: 'respiratory-acidosis' | 'respiratory-alkalosis',
  bicarbonate: number,
  acute: NumericRange,
  chronic: NumericRange,
  temporality: RespiratoryTemporality,
  processes: AcidBaseProcess[]
): CompensationResult {
  const acuteMatch = inRange(bicarbonate, acute);
  const chronicMatch = inRange(bicarbonate, chronic);
  const selected = temporality === 'acute' ? acute : temporality === 'chronic' ? chronic : { min: Math.min(acute.min, chronic.min), max: Math.max(acute.max, chronic.max) };
  let status: CompensationResult['status'];
  let interpretation: string;

  if (temporality === 'acute') {
    status = acuteMatch ? 'appropriate' : bicarbonate < acute.min ? 'below' : 'above';
    interpretation = acuteMatch ? 'Compatible con patrón agudo.' : 'No se explica por compensación respiratoria aguda aislada.';
  } else if (temporality === 'chronic') {
    status = chronicMatch ? 'appropriate' : bicarbonate < chronic.min ? 'below' : 'above';
    interpretation = chronicMatch ? 'Compatible con patrón crónico.' : 'No se explica por compensación respiratoria crónica aislada.';
  } else if (acuteMatch && chronicMatch) {
    status = 'both';
    interpretation = 'Compatible con ambos modelos; temporalidad no concluyente.';
  } else if (acuteMatch) {
    status = 'acute';
    interpretation = 'Compatible con patrón agudo.';
  } else if (chronicMatch) {
    status = 'chronic';
    interpretation = 'Compatible con patrón crónico.';
  } else {
    status = 'unexplained';
    interpretation = 'Patrón no explicado por compensación respiratoria aislada.';
  }

  const comparisonRanges = temporality === 'acute' ? [acute] : temporality === 'chronic' ? [chronic] : [acute, chronic];
  const lowestExpected = Math.min(...comparisonRanges.map((range) => range.min));
  const highestExpected = Math.max(...comparisonRanges.map((range) => range.max));
  if (bicarbonate < lowestExpected) {
    addProcess(processes, { type: 'metabolic-acidosis', label: 'Acidosis metabólica concomitante', role: 'concomitant' });
    interpretation += ' El HCO₃⁻ menor de lo esperado es compatible con acidosis metabólica concomitante.';
  } else if (bicarbonate > highestExpected) {
    addProcess(processes, { type: 'metabolic-alkalosis', label: 'Alcalosis metabólica concomitante', role: 'concomitant' });
    interpretation += ' El HCO₃⁻ mayor de lo esperado es compatible con alcalosis metabólica concomitante.';
  }

  return {
    disorder,
    measuredVariable: 'HCO₃⁻',
    measuredValue: bicarbonate,
    expected: selected,
    acuteExpected: acute,
    chronicExpected: chronic,
    status,
    interpretation
  };
}

function calculateAnionGap(input: AcidBaseInput): AnionGapResult | null {
  if (input.sodium === undefined || input.chloride === undefined) return null;
  const measured = input.sodium - (input.chloride + input.bicarbonate);
  const corrected = input.albumin !== undefined && input.albumin < 4
    ? measured + 2.5 * (4 - input.albumin)
    : null;
  const used = corrected ?? measured;
  return { measured, corrected, used, usedCorrected: corrected !== null, elevated: used > ACID_BASE_REFERENCE.anionGap };
}

function calculateDelta(anionGap: AnionGapResult, bicarbonate: number): DeltaResult {
  const deltaGap = anionGap.used - ACID_BASE_REFERENCE.anionGap;
  const correctedBicarbonate = bicarbonate + deltaGap;
  const denominator = ACID_BASE_REFERENCE.bicarbonate - bicarbonate;
  const ratio = denominator > 0 ? deltaGap / denominator : null;
  let interpretation: string | null = null;
  if (ratio !== null && Number.isFinite(ratio)) {
    if (ratio < 0.4) interpretation = 'Sugiere predominio de acidosis metabólica sin anion gap elevado.';
    else if (ratio < 0.8) interpretation = 'Compatible con acidosis metabólica con anion gap elevado más acidosis metabólica sin anion gap elevado.';
    else if (ratio <= 2) interpretation = 'Compatible predominantemente con acidosis metabólica con anion gap elevado.';
    else interpretation = 'Considerar alcalosis metabólica concomitante o elevación previa del bicarbonato.';
  }
  return { deltaGap, correctedBicarbonate, ratio: Number.isFinite(ratio) ? ratio : null, interpretation };
}

export function estimatePhWithHendersonHasselbalch(paco2: number, bicarbonate: number) {
  return 6.1 + Math.log10(bicarbonate / (0.03 * paco2));
}

export function interpretAcidBase(input: AcidBaseInput): AcidBaseInterpretationResult {
  const ph = classifyPh(input.ph);
  const metabolicStatus = input.bicarbonate < 24 ? 'low' : input.bicarbonate > 24 ? 'high' : 'reference';
  const processes: AcidBaseProcess[] = [];
  const calculationSteps: string[] = [];
  const notes: string[] = [];
  let compensation: CompensationResult | null = null;

  const useMetabolicAcidosis = input.bicarbonate < 24 && ph.status !== 'alkalemia';
  const useMetabolicAlkalosis = input.bicarbonate > 24 && ph.status !== 'acidemia';
  const useRespiratoryAcidosis = !useMetabolicAcidosis && input.paco2 > 40 && ph.status !== 'alkalemia';
  const useRespiratoryAlkalosis = !useMetabolicAlkalosis && input.paco2 < 40 && ph.status !== 'acidemia';

  if (useMetabolicAcidosis) {
    addProcess(processes, { type: 'metabolic-acidosis', label: 'Acidosis metabólica', role: 'primary' });
    const expected = calculateWinterRange(input.bicarbonate);
    const status = inRange(input.paco2, expected) ? 'appropriate' : input.paco2 > expected.max ? 'above' : 'below';
    let interpretation = 'Compensación respiratoria apropiada.';
    if (status === 'above') {
      interpretation = 'PaCO₂ mayor de la esperada; compatible con acidosis respiratoria concomitante.';
      addProcess(processes, { type: 'respiratory-acidosis', label: 'Acidosis respiratoria concomitante', role: 'concomitant' });
    } else if (status === 'below') {
      interpretation = 'PaCO₂ menor de la esperada; compatible con alcalosis respiratoria concomitante.';
      addProcess(processes, { type: 'respiratory-alkalosis', label: 'Alcalosis respiratoria concomitante', role: 'concomitant' });
    }
    compensation = { disorder: 'metabolic-acidosis', measuredVariable: 'PaCO₂', measuredValue: input.paco2, expected, status, interpretation };
    calculationSteps.push(`Winter: 1,5 × ${input.bicarbonate} + 8 = ${expected.central}; intervalo ${expected.min}–${expected.max} mmHg.`);
  } else if (useMetabolicAlkalosis) {
    addProcess(processes, { type: 'metabolic-alkalosis', label: 'Alcalosis metabólica', role: 'primary' });
    const expected = calculateMetabolicAlkalosisCompensation(input.bicarbonate);
    const status = inRange(input.paco2, expected) ? 'appropriate' : input.paco2 > expected.max ? 'above' : 'below';
    let interpretation = 'Compensación respiratoria apropiada.';
    if (status === 'above') {
      interpretation = 'PaCO₂ mayor de la esperada; compatible con acidosis respiratoria concomitante.';
      addProcess(processes, { type: 'respiratory-acidosis', label: 'Acidosis respiratoria concomitante', role: 'concomitant' });
    } else if (status === 'below') {
      interpretation = 'PaCO₂ menor de la esperada; compatible con alcalosis respiratoria concomitante.';
      addProcess(processes, { type: 'respiratory-alkalosis', label: 'Alcalosis respiratoria concomitante', role: 'concomitant' });
    }
    compensation = { disorder: 'metabolic-alkalosis', measuredVariable: 'PaCO₂', measuredValue: input.paco2, expected, status, interpretation };
    calculationSteps.push(`Alcalosis metabólica: ΔHCO₃⁻ = ${input.bicarbonate} − 24 = ${input.bicarbonate - 24}; PaCO₂ esperada ${expected.min}–${expected.max} mmHg.`);
    if (expected.max > 55) notes.push('La PaCO₂ compensatoria de una alcalosis metabólica simple generalmente no supera aproximadamente 55 mmHg; el intervalo calculado no fue recortado.');
  } else if (useRespiratoryAcidosis) {
    addProcess(processes, { type: 'respiratory-acidosis', label: 'Acidosis respiratoria', role: 'primary' });
    const ranges = calculateRespiratoryAcidosisRanges(input.paco2);
    compensation = evaluateRespiratoryCompensation('respiratory-acidosis', input.bicarbonate, ranges.acute, ranges.chronic, input.respiratoryTemporality, processes);
    calculationSteps.push(`Acidosis respiratoria: ΔCO₂ = (${input.paco2} − 40) / 10 = ${(input.paco2 - 40) / 10}; agudo ${ranges.acute.min}–${ranges.acute.max}, crónico ${ranges.chronic.min}–${ranges.chronic.max} mEq/L.`);
  } else if (useRespiratoryAlkalosis) {
    addProcess(processes, { type: 'respiratory-alkalosis', label: 'Alcalosis respiratoria', role: 'primary' });
    const ranges = calculateRespiratoryAlkalosisRanges(input.paco2);
    compensation = evaluateRespiratoryCompensation('respiratory-alkalosis', input.bicarbonate, ranges.acute, ranges.chronic, input.respiratoryTemporality, processes);
    calculationSteps.push(`Alcalosis respiratoria: ΔCO₂ = (40 − ${input.paco2}) / 10 = ${(40 - input.paco2) / 10}; agudo ${ranges.acute.min}–${ranges.acute.max}, crónico ${ranges.chronic.min}–${ranges.chronic.max} mEq/L.`);
  }

  const anionGap = calculateAnionGap(input);
  if (anionGap) {
    calculationSteps.push(`Anion gap: ${input.sodium} − (${input.chloride} + ${input.bicarbonate}) = ${anionGap.measured} mEq/L.`);
    if (anionGap.corrected !== null) calculationSteps.push(`Corrección por albúmina: ${anionGap.measured} + 2,5 × (4 − ${input.albumin}) = ${anionGap.corrected} mEq/L.`);
    notes.push('El valor de 12 mEq/L se utiliza como referencia matemática; el intervalo de anion gap depende del laboratorio y del método.');
  }

  const metabolicAcidosisIndex = processes.findIndex((process) => process.type === 'metabolic-acidosis');
  if (metabolicAcidosisIndex >= 0 && anionGap) {
    processes[metabolicAcidosisIndex] = anionGap.elevated
      ? { ...processes[metabolicAcidosisIndex], type: 'high-gap-metabolic-acidosis', label: 'Acidosis metabólica con anion gap elevado' }
      : { ...processes[metabolicAcidosisIndex], type: 'non-high-gap-metabolic-acidosis', label: 'Acidosis metabólica sin elevación del anion gap respecto de la referencia matemática' };
  }

  const hasMetabolicAcidosis = processes.some((process) => process.type === 'metabolic-acidosis' || process.type === 'high-gap-metabolic-acidosis' || process.type === 'non-high-gap-metabolic-acidosis');
  const delta = hasMetabolicAcidosis && anionGap?.elevated ? calculateDelta(anionGap, input.bicarbonate) : null;
  if (delta && anionGap) {
    calculationSteps.push(`Delta gap: ${anionGap.used} − 12 = ${delta.deltaGap} mEq/L; HCO₃⁻ corregido: ${input.bicarbonate} + ${delta.deltaGap} = ${delta.correctedBicarbonate} mEq/L.`);
    if (delta.ratio !== null) calculationSteps.push(`Delta ratio: (${anionGap.used} − 12) / (24 − ${input.bicarbonate}) = ${delta.ratio}.`);
    if (delta.ratio !== null && delta.ratio < 0.8) addProcess(processes, { type: 'non-high-gap-metabolic-acidosis', label: 'Acidosis metabólica sin anion gap elevado concomitante', role: 'concomitant' });
    if (delta.ratio !== null && delta.ratio > 2) addProcess(processes, { type: 'metabolic-alkalosis', label: 'Alcalosis metabólica concomitante sugerida por análisis delta', role: 'concomitant' });
  }

  const estimatedPh = estimatePhWithHendersonHasselbalch(input.paco2, input.bicarbonate);
  const difference = Math.abs(input.ph - estimatedPh);
  const coherence = { estimatedPh, difference, warning: difference > HENDERSON_HASSELBALCH_WARNING_THRESHOLD };
  calculationSteps.push(`Henderson-Hasselbalch: 6,1 + log₁₀(${input.bicarbonate} / (0,03 × ${input.paco2})) = ${estimatedPh}.`);

  const unexplained = compensation?.status === 'unexplained';
  const classification = processes.length === 0 ? 'none' : processes.length > 1 ? 'mixed' : unexplained ? 'indeterminate' : 'simple';
  const headline = classification === 'none'
    ? 'Sin alteración ácido-base evidente según los datos ingresados'
    : classification === 'mixed'
      ? 'Trastorno ácido-base mixto'
      : classification === 'indeterminate'
        ? 'Trastorno ácido-base no explicado por un patrón aislado'
        : 'Trastorno ácido-base simple';

  return { phStatus: ph.status, phLabel: ph.label, metabolicStatus, processes, classification, headline, compensation, anionGap, delta, coherence, calculationSteps, notes };
}
