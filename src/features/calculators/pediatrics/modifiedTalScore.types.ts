export type TalAgeGroup = 'underSixMonths' | 'sixMonthsOrOlder';

export type TalWheezing = 0 | 1 | 2 | 3;
export type TalRetractions = 0 | 1 | 2 | 3;
export type TalSeverity = 'LEVE' | 'MODERADA' | 'GRAVE';

export type ModifiedTalScoreInput = {
  ageGroup: TalAgeGroup;
  heartRate: number;
  respiratoryRate: number;
  wheezing: TalWheezing;
  retractions: TalRetractions;
};

export type ModifiedTalScoreBreakdown = {
  heartRate: number;
  respiratoryRate: number;
  wheezing: number;
  retractions: number;
};

export type ModifiedTalScoreResult = {
  total: number;
  severity: TalSeverity;
  breakdown: ModifiedTalScoreBreakdown;
};
