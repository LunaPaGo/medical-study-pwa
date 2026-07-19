import { ClinicalScoreCalculator } from '../components/ClinicalScoreCalculator';
import type { ClinicalScoreConfig } from '../components/clinicalScore';

const qsofaConfig: ClinicalScoreConfig = {
  title: 'qSOFA',
  description:
    'Herramienta rápida para identificar pacientes con sospecha de infección con mayor riesgo de mala evolución.',
  criteriaSummary: ['Cada criterio suma 1 punto. Puntaje total: 0–3.'],
  groups: [
    {
      id: 'qsofa-criteria',
      selectionMode: 'multiple',
      criteria: [
        { id: 'respiratory-rate', label: 'Frecuencia respiratoria ≥22/min', points: 1 },
        { id: 'systolic-pressure', label: 'Presión arterial sistólica ≤100 mmHg', points: 1 },
        { id: 'glasgow', label: 'Glasgow <15', points: 1 }
      ]
    }
  ],
  interpretationRules: [
    {
      label: '0–1',
      description: 'Bajo riesgo según qSOFA.',
      min: 0,
      max: 1,
      riskColor: 'low'
    },
    {
      label: '2–3',
      description: 'Mayor riesgo de evolución desfavorable.',
      min: 2,
      max: 3,
      riskColor: 'high'
    }
  ],
  warnings: [
    'No diagnostica sepsis.',
    'No reemplaza la evaluación clínica.',
    'Debe interpretarse junto con la sospecha de infección y el contexto clínico.'
  ],
  references: ['Sepsis-3 (Singer et al., 2016).']
};

export function QsofaCalculator() {
  return <ClinicalScoreCalculator config={qsofaConfig} />;
}
