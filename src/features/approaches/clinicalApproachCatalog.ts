import type { ClinicalApproachContent, RichTextBlock } from './clinicalApproachTypes';

export type ClinicalApproachSectionId = 'presentation' | 'initial-assessment' | 'life-threats' | 'anamnesis' | 'physical-exam' | 'differential-diagnosis' | 'complementary-studies' | 'decision-tree' | 'initial-treatment' | 'reassessment' | 'disposition' | 'warnings-and-instructions' | 'common-errors' | 'clinical-pearls' | 'related-content';
export type ClinicalApproachSection = { id: ClinicalApproachSectionId; title: string; quick: boolean };
export type ClinicalApproachRichTextKey = { [K in keyof ClinicalApproachContent]: ClinicalApproachContent[K] extends RichTextBlock ? K : never }[keyof ClinicalApproachContent];

export const clinicalApproachSections: ClinicalApproachSection[] = [
  { id: 'presentation', title: 'Presentación clínica', quick: false },
  { id: 'initial-assessment', title: 'Evaluación inicial y estabilidad', quick: true },
  { id: 'life-threats', title: 'Amenazas vitales', quick: true },
  { id: 'anamnesis', title: 'Anamnesis dirigida', quick: true },
  { id: 'physical-exam', title: 'Examen físico dirigido', quick: true },
  { id: 'differential-diagnosis', title: 'Diagnóstico diferencial jerarquizado', quick: true },
  { id: 'complementary-studies', title: 'Estudios complementarios', quick: true },
  { id: 'decision-tree', title: 'Razonamiento / árbol de decisión', quick: true },
  { id: 'initial-treatment', title: 'Tratamiento inicial', quick: true },
  { id: 'reassessment', title: 'Reevaluación', quick: true },
  { id: 'disposition', title: 'Disposición', quick: true },
  { id: 'warnings-and-instructions', title: 'Indicaciones y pautas de alarma', quick: true },
  { id: 'common-errors', title: 'Errores frecuentes', quick: false },
  { id: 'clinical-pearls', title: 'Perlas clínicas', quick: false },
  { id: 'related-content', title: 'Contenido relacionado', quick: false }
];

export const clinicalApproachRichTextSections: Array<{ key: ClinicalApproachRichTextKey; title: string }> = [
  { key: 'presentation', title: 'Presentación clínica' },
  { key: 'initialAssessment', title: 'Evaluación inicial y estabilidad' },
  { key: 'lifeThreats', title: 'Amenazas vitales' },
  { key: 'initialTreatment', title: 'Tratamiento inicial' },
  { key: 'reassessment', title: 'Reevaluación' },
  { key: 'warningsAndInstructions', title: 'Indicaciones y pautas de alarma' },
  { key: 'commonErrors', title: 'Errores frecuentes' },
  { key: 'clinicalPearls', title: 'Perlas clínicas' }
];

export function isClinicalApproachContent(value: unknown): value is ClinicalApproachContent {
  if (!value || typeof value !== 'object') return false;
  const content = value as Partial<ClinicalApproachContent>;
  return content.version === 1 && Array.isArray(content.anamnesis) && Array.isArray(content.physicalExam);
}
