import { ClinicalScoreCalculator } from '../components/ClinicalScoreCalculator';
import type { ClinicalScoreConfig } from '../components/clinicalScore';

const wellsPulmonaryEmbolismConfig: ClinicalScoreConfig = {
  title: 'Wells para Tromboembolismo Pulmonar',
  description: 'Estimación de la probabilidad clínica de embolia pulmonar.',
  criteriaSummary: ['Modelo clásico por puntaje. También se muestra el modelo simplificado.'],
  groups: [
    {
      id: 'wells-pe-criteria',
      selectionMode: 'multiple',
      criteria: [
        { id: 'dvt-signs', label: 'Signos clínicos de TVP', points: 3 },
        { id: 'alternative-diagnosis', label: 'Diagnóstico alternativo menos probable que TEP', points: 3 },
        { id: 'heart-rate', label: 'FC >100 lpm', points: 1.5 },
        { id: 'immobilization-surgery', label: 'Inmovilización ≥3 días o cirugía reciente', points: 1.5 },
        { id: 'previous-vte', label: 'TVP/TEP previo', points: 1.5 },
        { id: 'hemoptysis', label: 'Hemoptisis', points: 1 },
        { id: 'active-cancer', label: 'Cáncer activo', points: 1 }
      ]
    }
  ],
  interpretationRules: [
    {
      label: '<2',
      description: 'Probabilidad baja.',
      min: 0,
      maxExclusive: 2,
      riskColor: 'low'
    },
    {
      label: '2–6',
      description: 'Probabilidad intermedia.',
      min: 2,
      max: 6,
      riskColor: 'moderate'
    },
    {
      label: '>6',
      description: 'Probabilidad alta.',
      minExclusive: 6,
      riskColor: 'high'
    }
  ],
  additionalResultSections: [
    {
      label: 'Modelo simplificado',
      description: 'TEP improbable cuando el puntaje es ≤4. TEP probable cuando el puntaje es >4.',
      min: 0
    }
  ],
  warnings: [
    'El criterio "Diagnóstico alternativo menos probable que TEP" depende del juicio clínico y suele ser el más subjetivo de la escala.',
    'La escala no confirma ni descarta TEP por sí sola.',
    'Debe interpretarse junto con probabilidad clínica, dímero D e imágenes.'
  ],
  references: ['Wells et al.']
};

export function WellsPulmonaryEmbolismCalculator() {
  return <ClinicalScoreCalculator config={wellsPulmonaryEmbolismConfig} />;
}
