import type { ClinicalApproach, ClinicalApproachContent, RichTextBlock } from './clinicalApproachTypes';

export function createEmptyRichTextBlock(): RichTextBlock {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function createDefaultClinicalApproachContent(): ClinicalApproachContent {
  return {
    version: 1,
    presentation: createEmptyRichTextBlock(), initialAssessment: createEmptyRichTextBlock(), lifeThreats: createEmptyRichTextBlock(),
    anamnesis: [], physicalExam: [], differentialDiagnosis: { lifeThreatening: [], common: [], contextual: [] },
    complementaryStudies: [], decisionTree: { rootNodeId: null, nodes: [], edges: [] },
    initialTreatment: createEmptyRichTextBlock(), reassessment: createEmptyRichTextBlock(),
    disposition: { discharge: createEmptyRichTextBlock(), admission: createEmptyRichTextBlock(), criticalCare: createEmptyRichTextBlock(), referral: createEmptyRichTextBlock() },
    warningsAndInstructions: createEmptyRichTextBlock(), commonErrors: createEmptyRichTextBlock(), clinicalPearls: createEmptyRichTextBlock(), relatedContent: []
  };
}

export function createEmptyClinicalApproach(userId: string, id = crypto.randomUUID()): ClinicalApproach {
  const timestamp = new Date().toISOString();
  return { id, userId, title: '', description: '', categoryId: null, category: null, content: createDefaultClinicalApproachContent(), createdAt: timestamp, updatedAt: timestamp, status: 'draft' };
}
