const millisecondsPerDay = 24 * 60 * 60 * 1000;

export type ExactAge = {
  years: number;
  months: number;
  days: number;
};

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

export function calculateExactAge(birthDate: Date, referenceDate = new Date()): ExactAge {
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
