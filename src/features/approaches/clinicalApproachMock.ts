import type { TipTapDocument } from '../../types/topic';
import { createDefaultClinicalApproachContent } from './clinicalApproachFactory';
import type { ClinicalApproach } from './clinicalApproachTypes';

function textBlock(text: string): TipTapDocument {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

const content = createDefaultClinicalApproachContent();
content.presentation = textBlock('Área destinada a describir el motivo de consulta y la presentación del problema.');
content.initialAssessment = textBlock('Área destinada a organizar la evaluación inicial y la estabilidad clínica.');
content.lifeThreats = textBlock('Área prioritaria para registrar diagnósticos que no se pueden perder.');
content.anamnesis = [{ id: 'demo-history', title: 'Elemento demostrativo', content: textBlock('Aquí se explicará qué preguntar.'), whyItMatters: textBlock('Aquí se explicará por qué esa pregunta importa.') }];
content.physicalExam = [{ id: 'demo-exam', title: 'Elemento demostrativo', content: textBlock('Aquí se explicará qué buscar.'), whyItMatters: textBlock('Aquí se explicará por qué ese hallazgo importa.') }];
content.differentialDiagnosis = {
  lifeThreatening: [{ id: 'demo-critical', title: 'Amenaza vital', explanation: textBlock('Explicación estructurada.') }],
  common: [{ id: 'demo-common', title: 'Diagnóstico frecuente', explanation: textBlock('Explicación estructurada.') }],
  contextual: [{ id: 'demo-context', title: 'Diagnóstico según contexto', explanation: textBlock('Explicación estructurada.') }]
};
content.complementaryStudies = [{ id: 'demo-study', name: 'Estudio demostrativo', whenToOrder: textBlock('Cuándo pedirlo.'), targetFinding: textBlock('Qué se busca.'), interpretation: textBlock('Cómo aporta al razonamiento.') }];
content.decisionTree = {
  rootNodeId: 'demo-start',
  nodes: [{ id: 'demo-start', type: 'start', title: 'Inicio' }, { id: 'demo-action', type: 'action', title: 'Siguiente decisión' }],
  edges: [{ id: 'demo-edge', from: 'demo-start', to: 'demo-action', label: 'Continuar' }]
};
content.initialTreatment = textBlock('Área destinada a organizar la conducta inicial.');
content.reassessment = textBlock('Área destinada a definir qué y cuándo reevaluar.');
content.disposition = {
  discharge: textBlock('Criterios para alta.'), admission: textBlock('Criterios para internación.'),
  criticalCare: textBlock('Criterios para cuidados críticos.'), referral: textBlock('Criterios para derivación o interconsulta.')
};
content.warningsAndInstructions = textBlock('Área destinada a indicaciones y pautas de alarma.');
content.commonErrors = textBlock('Área destinada a errores frecuentes.');
content.clinicalPearls = textBlock('Área destinada a perlas clínicas.');
content.relatedContent = [{ id: 'demo-related', type: 'calculator', targetId: 'calculator-catalog-id', title: 'Referencia demostrativa no vinculada' }];

export const mockClinicalApproach: ClinicalApproach = {
  id: 'shell-demo', title: 'Abordaje demostrativo',
  description: 'Shell sin contenido médico real para validar la arquitectura y la experiencia de uso.',
  category: 'Categoría de ejemplo', tags: ['Estructura', 'Demostración'], content,
  createdAt: '2026-08-28T00:00:00.000Z', updatedAt: '2026-08-28T00:00:00.000Z', status: 'draft'
};
