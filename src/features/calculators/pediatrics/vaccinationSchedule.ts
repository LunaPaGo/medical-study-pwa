export type VaccinationAgeUnit = 'days' | 'months' | 'years';

export type VaccinationAgeMilestone = {
  value: number;
  unit: VaccinationAgeUnit;
};

export type VaccinationScheduleEntry = {
  id: string;
  vaccineName: string;
  doseLabel: string;
  recommendedAge: VaccinationAgeMilestone;
  notes?: string;
};

// Se completará en una etapa posterior con las vacunas y reglas clínicas vigentes.
export const vaccinationSchedule: readonly VaccinationScheduleEntry[] = [];
