import { isEmptyTipTapDocument } from '../topics/tiptapDocument';
import type { ClinicalApproachContent } from './clinicalApproachTypes';
import type { ClinicalApproachSectionId } from './clinicalApproachCatalog';

export function hasClinicalApproachSection(content: ClinicalApproachContent, id: ClinicalApproachSectionId) {
  switch (id) {
    case 'presentation': return !isEmptyTipTapDocument(content.presentation);
    case 'initial-assessment': return !isEmptyTipTapDocument(content.initialAssessment);
    case 'life-threats': return !isEmptyTipTapDocument(content.lifeThreats);
    case 'anamnesis': return content.anamnesis.length > 0;
    case 'physical-exam': return content.physicalExam.length > 0;
    case 'differential-diagnosis': return Object.values(content.differentialDiagnosis).some((items) => items.length > 0);
    case 'complementary-studies': return content.complementaryStudies.length > 0;
    case 'decision-tree': return content.decisionTree.nodes.length > 0;
    case 'initial-treatment': return !isEmptyTipTapDocument(content.initialTreatment);
    case 'reassessment': return !isEmptyTipTapDocument(content.reassessment);
    case 'disposition': return Object.values(content.disposition).some((document) => !isEmptyTipTapDocument(document));
    case 'warnings-and-instructions': return !isEmptyTipTapDocument(content.warningsAndInstructions);
    case 'common-errors': return !isEmptyTipTapDocument(content.commonErrors);
    case 'clinical-pearls': return !isEmptyTipTapDocument(content.clinicalPearls);
    case 'related-content': return content.relatedContent.length > 0;
  }
}
