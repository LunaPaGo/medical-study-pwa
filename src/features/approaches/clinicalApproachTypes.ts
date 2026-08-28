import type { TipTapDocument } from '../../types/topic';

export type ClinicalApproachStatus = 'draft' | 'complete';
export type ClinicalApproachViewMode = 'study' | 'quick';
export type RichTextBlock = TipTapDocument;

export type ReasoningItem = { id: string; title: string; content: RichTextBlock; whyItMatters: RichTextBlock };
export type DifferentialDiagnosisItem = { id: string; title: string; explanation: RichTextBlock; relatedContent?: RelatedContentReference };
export type DifferentialDiagnosisGroups = {
  lifeThreatening: DifferentialDiagnosisItem[];
  common: DifferentialDiagnosisItem[];
  contextual: DifferentialDiagnosisItem[];
};
export type ComplementaryStudy = {
  id: string;
  name: string;
  whenToOrder: RichTextBlock;
  targetFinding: RichTextBlock;
  interpretation: RichTextBlock;
};
export type DecisionNodeType = 'start' | 'question' | 'action' | 'warning' | 'disposition';
export type DecisionNode = { id: string; type: DecisionNodeType; title: string; description?: string };
export type DecisionEdge = { id: string; from: string; to: string; label?: string };
export type DecisionTree = { rootNodeId: string | null; nodes: DecisionNode[]; edges: DecisionEdge[] };
export type DispositionContent = { discharge: RichTextBlock; admission: RichTextBlock; criticalCare: RichTextBlock; referral: RichTextBlock };
export type RelatedContentType = 'topic' | 'medication' | 'procedure' | 'calculator' | 'approach';
export type RelatedContentReference = { id: string; type: RelatedContentType; targetId: string; title: string; note?: string };

export type ClinicalApproachContent = {
  version: 1;
  presentation: RichTextBlock;
  initialAssessment: RichTextBlock;
  lifeThreats: RichTextBlock;
  anamnesis: ReasoningItem[];
  physicalExam: ReasoningItem[];
  differentialDiagnosis: DifferentialDiagnosisGroups;
  complementaryStudies: ComplementaryStudy[];
  decisionTree: DecisionTree;
  initialTreatment: RichTextBlock;
  reassessment: RichTextBlock;
  disposition: DispositionContent;
  warningsAndInstructions: RichTextBlock;
  commonErrors: RichTextBlock;
  clinicalPearls: RichTextBlock;
  relatedContent: RelatedContentReference[];
};

export type ClinicalApproach = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  content: ClinicalApproachContent;
  createdAt: string;
  updatedAt: string;
  status: ClinicalApproachStatus;
};
