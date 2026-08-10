import { parseLocalCalendarDate, type VaccinationPatientContext } from './vaccinationAge';

export const scheduleVersion = 'Argentina 2026';

export type VaccinationScheduleCategory = 'routine' | 'conditional';

export type VaccinationAgeWindow =
  | { kind: 'months'; label: string; startMonths: number; endMonthsExclusive: number }
  | { kind: 'years'; label: string; startYears: number; endYearsExclusive?: number }
  | { kind: 'calendarYear'; label: string; targetAgeYears: 5 | 11 };

export type VaccinationScheduleEntry = {
  id: string;
  vaccine: string;
  dose: string;
  ageWindow: VaccinationAgeWindow;
  category: VaccinationScheduleCategory;
  description: string;
  notes?: string;
  requiresBirthDate: boolean;
  conditional: boolean;
  sourceNote: string;
  cohortRule?: 'early-second-mmr' | 'transition-second-mmr' | 'born-1965-or-later';
  historicalScope?: 'current-childhood-cohorts';
};

export type VaccinationRecommendationResult = {
  entries: readonly VaccinationScheduleEntry[];
  warnings: readonly string[];
};

const sourceNote = `Calendario Nacional de Vacunación — ${scheduleVersion}`;

export const mmrBirthDateWarning =
  'Triple viral: la indicación de la segunda dosis depende de la fecha de nacimiento exacta. Ingresá la fecha de nacimiento para determinar el esquema correspondiente.';

export const calendarYearApproximationWarning =
  'Para los hitos de 5 y 11 años, la indicación oficial corresponde al año calendario en que cumple esa edad. Con edad manual se muestra una aproximación por edad declarada.';

const months = (label: string, startMonths: number, endMonthsExclusive: number): VaccinationAgeWindow => ({
  kind: 'months',
  label,
  startMonths,
  endMonthsExclusive
});

const years = (label: string, startYears: number, endYearsExclusive?: number): VaccinationAgeWindow => ({
  kind: 'years',
  label,
  startYears,
  endYearsExclusive
});

const calendarYear = (targetAgeYears: 5 | 11): VaccinationAgeWindow => ({
  kind: 'calendarYear',
  label: `Año en que cumple ${targetAgeYears} años`,
  targetAgeYears
});

const routine = (
  entry: Omit<VaccinationScheduleEntry, 'category' | 'conditional' | 'requiresBirthDate' | 'sourceNote'> &
    Partial<Pick<VaccinationScheduleEntry, 'requiresBirthDate'>>
): VaccinationScheduleEntry => ({
  ...entry,
  category: 'routine',
  conditional: false,
  requiresBirthDate: entry.requiresBirthDate ?? false,
  sourceNote
});

const conditional = (
  entry: Omit<VaccinationScheduleEntry, 'category' | 'conditional' | 'requiresBirthDate' | 'sourceNote'> &
    Partial<Pick<VaccinationScheduleEntry, 'requiresBirthDate'>>
): VaccinationScheduleEntry => ({
  ...entry,
  category: 'conditional',
  conditional: true,
  requiresBirthDate: entry.requiresBirthDate ?? false,
  sourceNote
});

const newborn = months('Recién nacido', 0, 2);
const atTwoMonths = months('2 meses', 2, 3);
const atThreeMonths = months('3 meses', 3, 4);
const atFourMonths = months('4 meses', 4, 5);
const atFiveMonths = months('5 meses', 5, 6);
const atSixMonths = months('6 meses', 6, 7);
const sixToTwentyFourMonths = months('6 a 24 meses', 6, 25);
const atTwelveMonths = months('12 meses', 12, 13);
const atFifteenMonths = months('15 meses', 15, 16);
const fifteenToEighteenMonths = months('15 a 18 meses', 15, 19);
const atEighteenMonths = months('18 meses', 18, 19);
const yearFive = calendarYear(5);
const yearEleven = calendarYear(11);
const fromFiveYears = years('Desde los 5 años', 5);
const fromFifteenYears = years('Desde los 15 años', 15);
const fifteenToSixtyFourYears = years('15 a 64 años', 15, 65);
const fromSixtyFiveYears = years('65 años o más', 65);

export const vaccinationSchedule: readonly VaccinationScheduleEntry[] = [
  routine({ id: 'newborn-bcg', vaccine: 'BCG', dose: 'Dosis del recién nacido', ageWindow: newborn, description: 'Vacunación indicada al recién nacido.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'newborn-hepatitis-b', vaccine: 'Hepatitis B', dose: 'Dosis del recién nacido', ageWindow: newborn, description: 'Vacunación contra hepatitis B indicada al recién nacido.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'two-month-pneumococcal', vaccine: 'Neumococo conjugada', dose: '1.ª dosis', ageWindow: atTwoMonths, description: 'Primera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'two-month-ipv', vaccine: 'IPV / Poliomielitis', dose: '1.ª dosis', ageWindow: atTwoMonths, description: 'Primera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'two-month-pentavalent', vaccine: 'Quíntuple/Pentavalente', dose: '1.ª dosis', ageWindow: atTwoMonths, description: 'Primera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'two-month-rotavirus', vaccine: 'Rotavirus', dose: '1.ª dosis', ageWindow: atTwoMonths, description: 'Primera dosis del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'three-month-meningococcal', vaccine: 'Meningococo', dose: '1.ª dosis', ageWindow: atThreeMonths, description: 'Primera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'four-month-pneumococcal', vaccine: 'Neumococo conjugada', dose: '2.ª dosis', ageWindow: atFourMonths, description: 'Segunda dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'four-month-ipv', vaccine: 'IPV / Poliomielitis', dose: '2.ª dosis', ageWindow: atFourMonths, description: 'Segunda dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'four-month-pentavalent', vaccine: 'Quíntuple/Pentavalente', dose: '2.ª dosis', ageWindow: atFourMonths, description: 'Segunda dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'four-month-rotavirus', vaccine: 'Rotavirus', dose: '2.ª dosis', ageWindow: atFourMonths, description: 'Segunda dosis del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'five-month-meningococcal', vaccine: 'Meningococo', dose: '2.ª dosis', ageWindow: atFiveMonths, description: 'Segunda dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'six-month-ipv', vaccine: 'IPV / Poliomielitis', dose: '3.ª dosis', ageWindow: atSixMonths, description: 'Tercera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'six-month-pentavalent', vaccine: 'Quíntuple/Pentavalente', dose: '3.ª dosis', ageWindow: atSixMonths, description: 'Tercera dosis del esquema primario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'infant-influenza', vaccine: 'Antigripal', dose: 'Vacunación por edad', ageWindow: sixToTwentyFourMonths, description: 'Forma parte del calendario entre los 6 y los 24 meses.', notes: 'El número de dosis depende de los antecedentes.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'twelve-month-pneumococcal', vaccine: 'Neumococo conjugada', dose: 'Refuerzo', ageWindow: atTwelveMonths, description: 'Refuerzo del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'twelve-month-hepatitis-a', vaccine: 'Hepatitis A', dose: 'Dosis única', ageWindow: atTwelveMonths, description: 'Dosis única del calendario.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'twelve-month-mmr', vaccine: 'Triple viral SRP', dose: '1.ª dosis', ageWindow: atTwelveMonths, description: 'Primera dosis del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'fifteen-month-meningococcal', vaccine: 'Meningococo', dose: 'Refuerzo', ageWindow: atFifteenMonths, description: 'Refuerzo del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'fifteen-month-varicella', vaccine: 'Varicela', dose: '1.ª dosis', ageWindow: atFifteenMonths, description: 'Primera dosis del esquema.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'fifteen-to-eighteen-month-pentavalent', vaccine: 'Quíntuple/Pentavalente', dose: 'Refuerzo', ageWindow: fifteenToEighteenMonths, description: 'Refuerzo indicado entre los 15 y los 18 meses.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'early-second-mmr', vaccine: 'Triple viral SRP', dose: '2.ª dosis', ageWindow: fifteenToEighteenMonths, description: 'Segunda dosis entre los 15 y los 18 meses para personas nacidas desde el 1 de julio de 2024.', requiresBirthDate: true, cohortRule: 'early-second-mmr', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'five-year-ipv', vaccine: 'IPV / Poliomielitis', dose: 'Refuerzo', ageWindow: yearFive, description: 'Refuerzo en el año calendario en que cumple 5 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'five-year-dtp', vaccine: 'Triple bacteriana celular', dose: 'Refuerzo', ageWindow: yearFive, description: 'Refuerzo en el año calendario en que cumple 5 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'five-year-varicella', vaccine: 'Varicela', dose: '2.ª dosis', ageWindow: yearFive, description: 'Segunda dosis en el año calendario en que cumple 5 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'transition-second-mmr', vaccine: 'Triple viral SRP', dose: '2.ª dosis', ageWindow: yearFive, description: 'Segunda dosis de transición para personas nacidas entre el 1 de enero de 2021 y el 30 de junio de 2024.', requiresBirthDate: true, cohortRule: 'transition-second-mmr', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'eleven-year-hpv', vaccine: 'VPH', dose: 'Dosis única', ageWindow: yearEleven, description: 'Dosis única en el año calendario en que cumple 11 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'eleven-year-meningococcal', vaccine: 'Meningococo', dose: 'Dosis única', ageWindow: yearEleven, description: 'Dosis única en el año calendario en que cumple 11 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'eleven-year-dtpa', vaccine: 'Triple bacteriana acelular (dTpa)', dose: 'Dosis única', ageWindow: yearEleven, description: 'Dosis única en el año calendario en que cumple 11 años.', historicalScope: 'current-childhood-cohorts' }),
  routine({ id: 'senior-influenza', vaccine: 'Antigripal', dose: 'Una dosis anual', ageWindow: fromSixtyFiveYears, description: 'Vacunación anual para personas de 65 años o más.' }),
  routine({ id: 'senior-pneumococcal-vcn20', vaccine: 'Neumococo VCN20', dose: 'Una dosis', ageWindow: fromSixtyFiveYears, description: 'Una dosis según el calendario vigente.', notes: 'Si recibió previamente otras vacunas antineumocócicas, el esquema puede depender de los antecedentes.' }),

  conditional({ id: 'infant-influenza-history', vaccine: 'Antigripal', dose: 'Verificar antecedente', ageWindow: sixToTwentyFourMonths, description: 'Puede corresponder esquema inicial de 2 dosis separadas por ≥4 semanas o una dosis anual si ya recibió esquema previo.' }),
  conditional({ id: 'eighteen-month-yellow-fever', vaccine: 'Fiebre amarilla', dose: '1.ª dosis según situación', ageWindow: atEighteenMonths, description: 'Indicada a los 18 meses en residentes de zonas de riesgo.' }),
  conditional({ id: 'eleven-year-yellow-fever', vaccine: 'Fiebre amarilla', dose: 'Refuerzo según situación', ageWindow: yearEleven, description: 'Refuerzo a los 11 años únicamente para residentes en zonas de riesgo.' }),
  conditional({ id: 'measles-rubella-verification', vaccine: 'Doble/triple viral', dose: 'Verificar acreditación', ageWindow: fromFiveYears, description: 'Toda persona de 5 años o más debe acreditar al menos 2 dosis con componente sarampión/rubéola aplicadas después del año de vida.', notes: 'Las personas nacidas antes de 1965 se consideran inmunes y no requieren vacunación rutinaria contra sarampión/rubéola.', cohortRule: 'born-1965-or-later' }),
  conditional({ id: 'adult-dt', vaccine: 'Doble bacteriana (dT)', dose: 'Verificar esquema y último refuerzo', ageWindow: fromFifteenYears, description: 'Verificar esquema de 3 dosis y fecha del último refuerzo. Luego corresponde refuerzo cada 10 años.' }),
  conditional({ id: 'adult-risk-influenza', vaccine: 'Antigripal', dose: 'Anual según situación', ageWindow: fifteenToSixtyFourYears, description: 'Antigripal anual si presenta factores de riesgo.' }),
  conditional({ id: 'argentine-hemorrhagic-fever', vaccine: 'Fiebre Hemorrágica Argentina', dose: 'Según situación', ageWindow: fromFifteenYears, description: 'A partir de los 15 años para personas que residan o trabajen en zona endémica.' }),
  conditional({ id: 'senior-pneumococcal-history', vaccine: 'Neumococo', dose: 'Verificar antecedentes', ageWindow: fromSixtyFiveYears, description: 'Si recibió previamente otras vacunas antineumocócicas, el esquema puede depender de los antecedentes.' })
];

type Eligibility = 'eligible' | 'ineligible' | 'unknown';

function getBirthDate(context: VaccinationPatientContext): Date | null {
  return context.birthDate ? parseLocalCalendarDate(context.birthDate) : null;
}

function getReferenceDate(context: VaccinationPatientContext): Date | null {
  return parseLocalCalendarDate(context.referenceDate);
}

function dateIsWithin(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

export function isEligibleForEarlySecondMMR(birthDate: Date): boolean {
  return birthDate.getTime() >= new Date(2024, 6, 1).getTime();
}

export function isEligibleForTransitionSecondMMR(birthDate: Date): boolean {
  return dateIsWithin(birthDate, new Date(2021, 0, 1), new Date(2024, 5, 30));
}

function getEligibility(entry: VaccinationScheduleEntry, context: VaccinationPatientContext): Eligibility {
  if (!entry.cohortRule) return 'eligible';

  const birthDate = getBirthDate(context);
  if (entry.cohortRule === 'born-1965-or-later') {
    if (!birthDate) return 'eligible';
    return birthDate.getFullYear() >= 1965 ? 'eligible' : 'ineligible';
  }
  if (!birthDate) return 'unknown';
  if (entry.cohortRule === 'early-second-mmr') return isEligibleForEarlySecondMMR(birthDate) ? 'eligible' : 'ineligible';
  if (entry.cohortRule === 'transition-second-mmr') return isEligibleForTransitionSecondMMR(birthDate) ? 'eligible' : 'ineligible';
  return 'eligible';
}

function completedMonths(context: VaccinationPatientContext): number {
  return context.age.years * 12 + context.age.months;
}

function isCalendarYearActive(window: Extract<VaccinationAgeWindow, { kind: 'calendarYear' }>, context: VaccinationPatientContext): boolean {
  const birthDate = getBirthDate(context);
  const referenceDate = getReferenceDate(context);
  if (birthDate && referenceDate) return referenceDate.getFullYear() === birthDate.getFullYear() + window.targetAgeYears;
  return context.age.years === window.targetAgeYears;
}

function hasReachedWindow(window: VaccinationAgeWindow, context: VaccinationPatientContext): boolean {
  if (window.kind === 'months') return completedMonths(context) >= window.startMonths;
  if (window.kind === 'years') return context.age.years >= window.startYears;

  const birthDate = getBirthDate(context);
  const referenceDate = getReferenceDate(context);
  if (birthDate && referenceDate) return referenceDate.getFullYear() >= birthDate.getFullYear() + window.targetAgeYears;
  return context.age.years >= window.targetAgeYears;
}

function isWindowActive(window: VaccinationAgeWindow, context: VaccinationPatientContext): boolean {
  if (window.kind === 'months') {
    const ageInMonths = completedMonths(context);
    return ageInMonths >= window.startMonths && ageInMonths < window.endMonthsExclusive;
  }
  if (window.kind === 'years') {
    return context.age.years >= window.startYears && (window.endYearsExclusive === undefined || context.age.years < window.endYearsExclusive);
  }
  return isCalendarYearActive(window, context);
}

function isRelevantChildhoodHistory(entry: VaccinationScheduleEntry, context: VaccinationPatientContext): boolean {
  return entry.historicalScope !== 'current-childhood-cohorts' || context.age.years < 15;
}

function collect(
  context: VaccinationPatientContext,
  category: VaccinationScheduleCategory,
  matchesWindow: (window: VaccinationAgeWindow, context: VaccinationPatientContext) => boolean,
  historical = false
): VaccinationRecommendationResult {
  const entries: VaccinationScheduleEntry[] = [];
  const warnings = new Set<string>();

  for (const entry of vaccinationSchedule) {
    if (entry.category !== category || !matchesWindow(entry.ageWindow, context)) continue;
    if (historical && !isRelevantChildhoodHistory(entry, context)) continue;

    const eligibility = getEligibility(entry, context);
    if (eligibility === 'eligible') entries.push(entry);
    if (eligibility === 'unknown') warnings.add(mmrBirthDateWarning);
  }

  return { entries, warnings: [...warnings] };
}

export function getVaccinesReached(context: VaccinationPatientContext): VaccinationRecommendationResult {
  return collect(context, 'routine', hasReachedWindow, true);
}

export function getVaccinesDueNow(context: VaccinationPatientContext): VaccinationRecommendationResult {
  return collect(context, 'routine', isWindowActive);
}

export function getConditionalRecommendations(context: VaccinationPatientContext): VaccinationRecommendationResult {
  const result = collect(context, 'conditional', isWindowActive);
  const warnings = new Set(result.warnings);
  const hasUnresolvedMmrCohort = vaccinationSchedule.some(
    (entry) =>
      entry.category === 'routine' &&
      entry.requiresBirthDate &&
      (isWindowActive(entry.ageWindow, context) || (context.age.years < 15 && hasReachedWindow(entry.ageWindow, context))) &&
      getEligibility(entry, context) === 'unknown'
  );
  if (hasUnresolvedMmrCohort) warnings.add(mmrBirthDateWarning);

  const hasApproximateCalendarYear = context.inputMode === 'age' && vaccinationSchedule.some(
    (entry) => isWindowActive(entry.ageWindow, context) && entry.ageWindow.kind === 'calendarYear'
  );
  if (hasApproximateCalendarYear) warnings.add(calendarYearApproximationWarning);

  return { entries: result.entries, warnings: [...warnings] };
}
