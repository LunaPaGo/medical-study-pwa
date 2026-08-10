const millisecondsPerDay = 24 * 60 * 60 * 1000;

export type VaccinationAge = {
  years: number;
  months: number;
  days: number;
};

export type VaccinationInputMode = 'birthDate' | 'age';

export type VaccinationPatientContext = {
  age: VaccinationAge;
  birthDate?: string;
  inputMode: VaccinationInputMode;
  referenceDate: string;
};

export type ManualVaccinationAgeValidation =
  | { age: VaccinationAge; error: null }
  | { age: null; error: string };

function parseNonNegativeInteger(value: string): number | null {
  const trimmedValue = value.trim();
  if (!/^\d+$/.test(trimmedValue)) return null;

  const parsedValue = Number(trimmedValue);
  if (!Number.isSafeInteger(parsedValue)) return null;
  return parsedValue;
}

export function validateManualVaccinationAge(
  yearsValue: string,
  monthsValue: string,
  daysValue: string
): ManualVaccinationAgeValidation {
  const years = parseNonNegativeInteger(yearsValue);
  const months = parseNonNegativeInteger(monthsValue || '0');
  const days = parseNonNegativeInteger(daysValue || '0');

  if (years === null) return { age: null, error: 'Ingresá los años como un número entero mayor o igual a 0.' };
  if (months === null || months > 11) return { age: null, error: 'Los meses deben ser un número entero entre 0 y 11.' };
  if (days === null || days > 30) return { age: null, error: 'Los días deben ser un número entero entre 0 y 30.' };

  return { age: { years, months, days }, error: null };
}

export function formatVaccinationAge(age: VaccinationAge): string {
  const parts: string[] = [];
  if (age.years > 0) parts.push(`${age.years} ${age.years === 1 ? 'año' : 'años'}`);
  if (age.months > 0) parts.push(`${age.months} ${age.months === 1 ? 'mes' : 'meses'}`);
  if (age.days > 0) parts.push(`${age.days} ${age.days === 1 ? 'día' : 'días'}`);
  return parts.length > 0 ? parts.join(', ').replace(/, ([^,]*)$/, ' y $1') : '0 días';
}

export function parseLocalCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  return date;
}

export function startOfLocalCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatLocalDateInput(date: Date): string {
  const localDate = startOfLocalCalendarDay(date);
  const year = String(localDate.getFullYear()).padStart(4, '0');
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addCalendarYearsClamped(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const day = Math.min(date.getDate(), daysInMonth(targetYear, date.getMonth()));
  return new Date(targetYear, date.getMonth(), day);
}

function addCalendarMonthsClamped(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths - targetYear * 12;
  const day = Math.min(date.getDate(), daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, day);
}

function differenceInCalendarDays(laterDate: Date, earlierDate: Date): number {
  const laterUtc = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate());
  const earlierUtc = Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate());
  return Math.round((laterUtc - earlierUtc) / millisecondsPerDay);
}

export function calculateExactAge(birthDate: Date, referenceDate = new Date()): VaccinationAge {
  const birth = startOfLocalCalendarDay(birthDate);
  const reference = startOfLocalCalendarDay(referenceDate);

  if (birth.getTime() > reference.getTime()) {
    throw new RangeError('La fecha de nacimiento no puede ser futura.');
  }

  let years = reference.getFullYear() - birth.getFullYear();
  let yearAnniversary = addCalendarYearsClamped(birth, years);
  if (yearAnniversary.getTime() > reference.getTime()) {
    years -= 1;
    yearAnniversary = addCalendarYearsClamped(birth, years);
  }

  let months = 0;
  while (months < 11 && addCalendarMonthsClamped(yearAnniversary, months + 1).getTime() <= reference.getTime()) {
    months += 1;
  }

  const monthAnniversary = addCalendarMonthsClamped(yearAnniversary, months);
  const days = differenceInCalendarDays(reference, monthAnniversary);

  return { years, months, days };
}
