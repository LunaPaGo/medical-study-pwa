import type {
  ModifiedTalScoreInput,
  ModifiedTalScoreResult,
  TalAgeGroup,
  TalSeverity
} from './modifiedTalScore.types';

export function scoreTalHeartRate(heartRate: number): number {
  if (heartRate < 120) return 0;
  if (heartRate <= 140) return 1;
  if (heartRate <= 160) return 2;
  return 3;
}

export function scoreTalRespiratoryRate(respiratoryRate: number, ageGroup: TalAgeGroup): number {
  if (ageGroup === 'underSixMonths') {
    if (respiratoryRate <= 40) return 0;
    if (respiratoryRate <= 55) return 1;
    if (respiratoryRate <= 70) return 2;
    return 3;
  }

  if (respiratoryRate <= 30) return 0;
  if (respiratoryRate <= 45) return 1;
  if (respiratoryRate <= 60) return 2;
  return 3;
}

export function interpretModifiedTalScore(total: number): TalSeverity {
  if (total <= 4) return 'LEVE';
  if (total <= 8) return 'MODERADA';
  return 'GRAVE';
}

export function calculateModifiedTalScore(input: ModifiedTalScoreInput): ModifiedTalScoreResult {
  const breakdown = {
    heartRate: scoreTalHeartRate(input.heartRate),
    respiratoryRate: scoreTalRespiratoryRate(input.respiratoryRate, input.ageGroup),
    wheezing: input.wheezing,
    retractions: input.retractions
  };
  const total = breakdown.heartRate + breakdown.respiratoryRate + breakdown.wheezing + breakdown.retractions;

  return {
    total,
    severity: interpretModifiedTalScore(total),
    breakdown
  };
}
