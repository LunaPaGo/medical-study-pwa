import { parseLocalCalendarDate, startOfLocalCalendarDay, type VaccinationPatientContext } from './vaccinationAge';

export type VaccinationAgeWindow = {
  label: string;
  startMonths: number;
  endMonthsExclusive: number;
};

export type VaccinationScheduleEntry = {
  id: string;
  ageWindow: VaccinationAgeWindow;
  vaccine: string;
  dose: string;
  description: string;
  observation?: string;
  eligibility?: 'early-second-mmr';
};

export type VaccinationRecommendationResult = {
  milestones: readonly VaccinationScheduleEntry[];
  warnings: readonly string[];
};

export const exactBirthDateRequiredWarning =
  'Esta recomendación depende de la fecha de nacimiento exacta. Ingresá la fecha de nacimiento para determinarla.';

const window = (label: string, startMonths: number, endMonthsExclusive: number): VaccinationAgeWindow => ({
  label,
  startMonths,
  endMonthsExclusive
});

const newbornWindow = window('Recién nacido', 0, 2);
const twoMonthWindow = window('2 meses', 2, 3);
const threeMonthWindow = window('3 meses', 3, 4);
const fourMonthWindow = window('4 meses', 4, 5);
const fiveMonthWindow = window('5 meses', 5, 6);
const sixMonthWindow = window('6 meses', 6, 7);
const sixToTwentyFourMonthWindow = window('6 a 24 meses', 6, 25);
const twelveMonthWindow = window('12 meses', 12, 13);
const fifteenMonthWindow = window('15 meses', 15, 16);
const fifteenToEighteenMonthWindow = window('15 a 18 meses', 15, 19);

export const vaccinationSchedule: readonly VaccinationScheduleEntry[] = [
  {
    id: 'newborn-bcg',
    ageWindow: newbornWindow,
    vaccine: 'BCG',
    dose: 'Dosis del recién nacido',
    description: 'Vacunación indicada al recién nacido.'
  },
  {
    id: 'newborn-hepatitis-b',
    ageWindow: newbornWindow,
    vaccine: 'Hepatitis B',
    dose: 'Dosis del recién nacido',
    description: 'Vacunación contra hepatitis B indicada al recién nacido.'
  },
  {
    id: 'two-month-pneumococcal',
    ageWindow: twoMonthWindow,
    vaccine: 'Neumococo conjugada',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema primario.'
  },
  {
    id: 'two-month-ipv',
    ageWindow: twoMonthWindow,
    vaccine: 'IPV / Poliomielitis',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema primario.'
  },
  {
    id: 'two-month-pentavalent',
    ageWindow: twoMonthWindow,
    vaccine: 'Pentavalente',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema primario.'
  },
  {
    id: 'two-month-rotavirus',
    ageWindow: twoMonthWindow,
    vaccine: 'Rotavirus',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema.'
  },
  {
    id: 'three-month-meningococcal',
    ageWindow: threeMonthWindow,
    vaccine: 'Meningococo',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema primario.'
  },
  {
    id: 'four-month-pneumococcal',
    ageWindow: fourMonthWindow,
    vaccine: 'Neumococo conjugada',
    dose: '2.ª dosis',
    description: 'Segunda dosis del esquema primario.'
  },
  {
    id: 'four-month-ipv',
    ageWindow: fourMonthWindow,
    vaccine: 'IPV / Poliomielitis',
    dose: '2.ª dosis',
    description: 'Segunda dosis del esquema primario.'
  },
  {
    id: 'four-month-pentavalent',
    ageWindow: fourMonthWindow,
    vaccine: 'Pentavalente',
    dose: '2.ª dosis',
    description: 'Segunda dosis del esquema primario.'
  },
  {
    id: 'four-month-rotavirus',
    ageWindow: fourMonthWindow,
    vaccine: 'Rotavirus',
    dose: '2.ª dosis',
    description: 'Segunda dosis del esquema.'
  },
  {
    id: 'five-month-meningococcal',
    ageWindow: fiveMonthWindow,
    vaccine: 'Meningococo',
    dose: '2.ª dosis',
    description: 'Segunda dosis del esquema primario.'
  },
  {
    id: 'six-month-ipv',
    ageWindow: sixMonthWindow,
    vaccine: 'IPV / Poliomielitis',
    dose: '3.ª dosis',
    description: 'Tercera dosis del esquema primario.'
  },
  {
    id: 'six-month-pentavalent',
    ageWindow: sixMonthWindow,
    vaccine: 'Pentavalente',
    dose: '3.ª dosis',
    description: 'Tercera dosis del esquema primario.'
  },
  {
    id: 'six-to-twenty-four-month-influenza',
    ageWindow: sixToTwentyFourMonthWindow,
    vaccine: 'Antigripal',
    dose: 'Vacunación por ventana de edad',
    description: 'Recomendación de vacunación antigripal entre los 6 y los 24 meses.',
    observation: 'La cantidad de dosis depende de los antecedentes vacunales, que esta herramienta no evalúa.'
  },
  {
    id: 'twelve-month-pneumococcal',
    ageWindow: twelveMonthWindow,
    vaccine: 'Neumococo conjugada',
    dose: 'Refuerzo',
    description: 'Refuerzo del esquema.'
  },
  {
    id: 'twelve-month-hepatitis-a',
    ageWindow: twelveMonthWindow,
    vaccine: 'Hepatitis A',
    dose: 'Dosis única',
    description: 'Dosis única del calendario.'
  },
  {
    id: 'twelve-month-mmr',
    ageWindow: twelveMonthWindow,
    vaccine: 'Triple viral',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema.'
  },
  {
    id: 'fifteen-month-meningococcal',
    ageWindow: fifteenMonthWindow,
    vaccine: 'Meningococo',
    dose: 'Refuerzo',
    description: 'Refuerzo del esquema.'
  },
  {
    id: 'fifteen-month-varicella',
    ageWindow: fifteenMonthWindow,
    vaccine: 'Varicela',
    dose: '1.ª dosis',
    description: 'Primera dosis del esquema.'
  },
  {
    id: 'fifteen-to-eighteen-month-pentavalent',
    ageWindow: fifteenToEighteenMonthWindow,
    vaccine: 'Pentavalente',
    dose: 'Refuerzo',
    description: 'Refuerzo indicado entre los 15 y los 18 meses.'
  },
  {
    id: 'fifteen-to-eighteen-month-mmr',
    ageWindow: fifteenToEighteenMonthWindow,
    vaccine: 'Triple viral',
    dose: '2.ª dosis',
    description: 'Segunda dosis indicada entre los 15 y los 18 meses para la cohorte alcanzada por la pauta 2026.',
    observation: 'Se aplica a personas nacidas desde el 1 de julio de 2024.',
    eligibility: 'early-second-mmr'
  }
];

export function isEligibleForEarlySecondMMR(birthDate: Date): boolean {
  const cohortStart = new Date(2024, 6, 1);
  return startOfLocalCalendarDay(birthDate).getTime() >= cohortStart.getTime();
}

type EligibilityResult = 'eligible' | 'ineligible' | 'unknown';

function getEntryEligibility(entry: VaccinationScheduleEntry, context: VaccinationPatientContext): EligibilityResult {
  if (!entry.eligibility) return 'eligible';
  if (!context.birthDate) return 'unknown';

  const birthDate = parseLocalCalendarDate(context.birthDate);
  if (!birthDate) return 'unknown';
  if (entry.eligibility === 'early-second-mmr') {
    return isEligibleForEarlySecondMMR(birthDate) ? 'eligible' : 'ineligible';
  }
  return 'eligible';
}

function completedMonths(context: VaccinationPatientContext): number {
  return context.age.years * 12 + context.age.months;
}

function hasReachedWindow(entry: VaccinationScheduleEntry, context: VaccinationPatientContext): boolean {
  return completedMonths(context) >= entry.ageWindow.startMonths;
}

function isWindowActive(entry: VaccinationScheduleEntry, context: VaccinationPatientContext): boolean {
  const ageInCompletedMonths = completedMonths(context);
  return ageInCompletedMonths >= entry.ageWindow.startMonths && ageInCompletedMonths < entry.ageWindow.endMonthsExclusive;
}

function getRecommendations(
  context: VaccinationPatientContext,
  matchesWindow: (entry: VaccinationScheduleEntry, context: VaccinationPatientContext) => boolean
): VaccinationRecommendationResult {
  const milestones: VaccinationScheduleEntry[] = [];
  let requiresExactBirthDate = false;

  for (const entry of vaccinationSchedule) {
    if (!matchesWindow(entry, context)) continue;

    const eligibility = getEntryEligibility(entry, context);
    if (eligibility === 'eligible') milestones.push(entry);
    if (eligibility === 'unknown') requiresExactBirthDate = true;
  }

  return {
    milestones,
    warnings: requiresExactBirthDate ? [exactBirthDateRequiredWarning] : []
  };
}

export function getReachedVaccinationMilestones(context: VaccinationPatientContext): VaccinationRecommendationResult {
  return getRecommendations(context, hasReachedWindow);
}

export function getCurrentVaccinationMilestones(context: VaccinationPatientContext): VaccinationRecommendationResult {
  return getRecommendations(context, isWindowActive);
}
