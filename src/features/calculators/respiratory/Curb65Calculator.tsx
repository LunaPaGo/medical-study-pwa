import { ClinicalScoreCalculator } from '../components/ClinicalScoreCalculator';
import type { ClinicalScoreConfig } from '../components/clinicalScore';

const curb65Config: ClinicalScoreConfig = {
  title: 'CURB-65',
  description: 'Estimación del riesgo de mortalidad en neumonía adquirida en la comunidad.',
  criteriaSummary: ['Cada criterio suma 1 punto. Puntaje total: 0–5.'],
  groups: [
    {
      id: 'curb65-criteria',
      selectionMode: 'multiple',
      criteria: [
        { id: 'confusion', label: 'Confusión', points: 1 },
        { id: 'urea', label: 'Urea >7 mmol/L', points: 1 },
        { id: 'respiratory-rate', label: 'Frecuencia respiratoria ≥30/min', points: 1 },
        { id: 'blood-pressure', label: 'PAS <90 mmHg o PAD ≤60 mmHg', points: 1 },
        { id: 'age', label: 'Edad ≥65 años', points: 1 }
      ]
    }
  ],
  interpretationRules: [
    {
      label: '0–1',
      description: 'Bajo riesgo. Generalmente tratamiento ambulatorio si el contexto lo permite.',
      min: 0,
      max: 1,
      riskColor: 'low'
    },
    {
      label: '2',
      description: 'Riesgo intermedio. Considerar internación.',
      min: 2,
      max: 2,
      riskColor: 'moderate'
    },
    {
      label: '3–5',
      description: 'Riesgo elevado. Generalmente requiere internación y valorar UTI.',
      min: 3,
      max: 5,
      riskColor: 'high'
    }
  ],
  warnings: [
    'No reemplaza el juicio clínico.',
    'Debe interpretarse junto con comorbilidades, oxigenación, soporte social y evaluación médica.'
  ],
  references: ['Lim et al.']
};

export function Curb65Calculator() {
  return <ClinicalScoreCalculator config={curb65Config} />;
}
