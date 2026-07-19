const millisecondsPerDay = 24 * 60 * 60 * 1000;

export type GestationalAge = {
  days: number;
  weeks: number;
};

export type GestationalAgeResult = {
  currentGestationalAge: GestationalAge;
  dueDate: Date;
  estimatedLmp: Date;
  isDueDatePassed: boolean;
  isOver42Weeks: boolean;
  referenceDate: Date;
  secondTrimesterStart: Date;
  temporalSituation: 'Primer trimestre' | 'Segundo trimestre' | 'Tercer trimestre';
  thirdTrimesterStart: Date;
};

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  return date;
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfLocalDay(nextDate);
}

export function differenceInCalendarDays(laterDate: Date, earlierDate: Date) {
  return Math.round((startOfLocalDay(laterDate).getTime() - startOfLocalDay(earlierDate).getTime()) / millisecondsPerDay);
}

export function calculateEstimatedLmp(ultrasoundDate: Date, gestationalAgeDays: number) {
  return addCalendarDays(ultrasoundDate, -gestationalAgeDays);
}

export function calculateEstimatedDueDate(estimatedLmp: Date) {
  return addCalendarDays(estimatedLmp, 280);
}

export function calculateTrimesterStartDates(estimatedLmp: Date) {
  return {
    secondTrimesterStart: addCalendarDays(estimatedLmp, 98),
    thirdTrimesterStart: addCalendarDays(estimatedLmp, 196)
  };
}

export function calculateCurrentGestationalAge(estimatedLmp: Date, referenceDate = new Date()): GestationalAge {
  const totalDays = differenceInCalendarDays(referenceDate, estimatedLmp);
  return {
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7
  };
}

export function getTrimester(totalGestationalDays: number): GestationalAgeResult['temporalSituation'] {
  if (totalGestationalDays < 98) return 'Primer trimestre';
  if (totalGestationalDays < 196) return 'Segundo trimestre';
  return 'Tercer trimestre';
}

export function calculateGestationalAgeFromUltrasound(
  ultrasoundDate: Date,
  ultrasoundGestationalAgeDays: number,
  referenceDate = new Date()
): GestationalAgeResult {
  const localUltrasoundDate = startOfLocalDay(ultrasoundDate);
  const localReferenceDate = startOfLocalDay(referenceDate);
  const estimatedLmp = calculateEstimatedLmp(localUltrasoundDate, ultrasoundGestationalAgeDays);
  const dueDate = calculateEstimatedDueDate(estimatedLmp);
  const { secondTrimesterStart, thirdTrimesterStart } = calculateTrimesterStartDates(estimatedLmp);
  const currentGestationalAge = calculateCurrentGestationalAge(estimatedLmp, localReferenceDate);
  const totalGestationalDays = currentGestationalAge.weeks * 7 + currentGestationalAge.days;

  return {
    currentGestationalAge,
    dueDate,
    estimatedLmp,
    isDueDatePassed: differenceInCalendarDays(localReferenceDate, dueDate) > 0,
    isOver42Weeks: totalGestationalDays > 294,
    referenceDate: localReferenceDate,
    secondTrimesterStart,
    temporalSituation: getTrimester(totalGestationalDays),
    thirdTrimesterStart
  };
}
