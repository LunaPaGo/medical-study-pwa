export type ClinicalScoreSelectionMode = 'multiple' | 'single';

export type ClinicalScoreCriterion = {
  id: string;
  label: string;
  points: number;
};

export type ClinicalScoreCriterionGroup = {
  id: string;
  title?: string;
  selectionMode: ClinicalScoreSelectionMode;
  criteria: ClinicalScoreCriterion[];
  required?: boolean;
};

export type ClinicalScoreInterpretation = {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
  riskColor?: 'low' | 'moderate' | 'high' | 'neutral';
};

export type ClinicalScoreConfig = {
  title: string;
  description: string;
  criteriaSummary?: string[];
  groups: ClinicalScoreCriterionGroup[];
  interpretationRules: ClinicalScoreInterpretation[];
  warnings: string[];
  references: string[];
  additionalResultSections?: ClinicalScoreInterpretation[];
};

export type ClinicalScoreResult = {
  score: number;
  positiveCriteria: ClinicalScoreCriterion[];
  negativeCriteria: ClinicalScoreCriterion[];
  interpretation: ClinicalScoreInterpretation | null;
  additionalInterpretations: ClinicalScoreInterpretation[];
};

export type ClinicalScoreSelections = Record<string, string[]>;

export function calculateClinicalScore(config: ClinicalScoreConfig, selections: ClinicalScoreSelections): ClinicalScoreResult {
  const positiveCriteria: ClinicalScoreCriterion[] = [];
  const negativeCriteria: ClinicalScoreCriterion[] = [];

  for (const group of config.groups) {
    const selectedIds = new Set(selections[group.id] ?? []);

    for (const criterion of group.criteria) {
      if (selectedIds.has(criterion.id)) {
        positiveCriteria.push(criterion);
      } else {
        negativeCriteria.push(criterion);
      }
    }
  }

  const score = positiveCriteria.reduce((total, criterion) => total + criterion.points, 0);

  return {
    score,
    positiveCriteria,
    negativeCriteria,
    interpretation: findClinicalScoreInterpretation(config.interpretationRules, score),
    additionalInterpretations: (config.additionalResultSections ?? [])
      .map((rules) => findClinicalScoreInterpretation([rules], score))
      .filter((rule): rule is ClinicalScoreInterpretation => Boolean(rule))
  };
}

export function findClinicalScoreInterpretation(
  interpretationRules: ClinicalScoreInterpretation[],
  score: number
): ClinicalScoreInterpretation | null {
  return (
    interpretationRules.find((rule) => {
      if (typeof rule.min === 'number' && score < rule.min) return false;
      if (typeof rule.max === 'number' && score > rule.max) return false;
      if (typeof rule.minExclusive === 'number' && score <= rule.minExclusive) return false;
      if (typeof rule.maxExclusive === 'number' && score >= rule.maxExclusive) return false;
      return true;
    }) ?? null
  );
}
