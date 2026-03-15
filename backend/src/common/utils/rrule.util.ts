import { RRule, RRuleSet, rrulestr } from 'rrule';

export interface SessionDateRange {
  startTime: Date;
  endTime: Date;
}

export interface VacationPeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Generates course session dates from an RRULE string between a date range,
 * skipping any dates that fall within vacation periods.
 */
export function generateSessionDates(
  rruleString: string,
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  vacations: VacationPeriod[] = [],
): SessionDateRange[] {
  let rule: RRule | RRuleSet;

  try {
    rule = rrulestr(rruleString);
  } catch (error) {
    throw new Error(`Invalid RRULE string: ${rruleString}. Error: ${error.message}`);
  }

  const occurrences = rule.between(rangeStart, rangeEnd, true);

  const sessions: SessionDateRange[] = [];

  for (const startTime of occurrences) {
    if (isDateInVacation(startTime, vacations)) {
      continue;
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    sessions.push({ startTime, endTime });
  }

  return sessions;
}

/**
 * Check if a date falls within any vacation period
 */
export function isDateInVacation(date: Date, vacations: VacationPeriod[]): boolean {
  const dateMs = date.getTime();

  for (const vacation of vacations) {
    const startMs = new Date(vacation.startDate).setHours(0, 0, 0, 0);
    const endMs = new Date(vacation.endDate).setHours(23, 59, 59, 999);

    if (dateMs >= startMs && dateMs <= endMs) {
      return true;
    }
  }

  return false;
}

/**
 * Validate an RRULE string
 */
export function validateRRule(rruleString: string): boolean {
  try {
    rrulestr(rruleString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a human-readable description of an RRULE
 */
export function getRRuleText(rruleString: string): string {
  try {
    const rule = rrulestr(rruleString);
    return rule.toText();
  } catch {
    return rruleString;
  }
}

/**
 * Build an RRULE string from common schedule patterns
 */
export function buildWeeklyRRule(
  dayOfWeek: number, // 0=Sunday, 1=Monday, ...
  startHour: number,
  startMinute: number,
  startDate?: Date,
): string {
  const rruleDays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

  const dtstart = startDate || new Date();
  dtstart.setHours(startHour, startMinute, 0, 0);

  const rule = new RRule({
    freq: RRule.WEEKLY,
    byweekday: [rruleDays[dayOfWeek]],
    dtstart,
  });

  return rule.toString();
}

/**
 * Count sessions that would be generated in a period
 */
export function countSessionsInPeriod(
  rruleString: string,
  rangeStart: Date,
  rangeEnd: Date,
  vacations: VacationPeriod[] = [],
): number {
  const sessions = generateSessionDates(rruleString, rangeStart, rangeEnd, 60, vacations);
  return sessions.length;
}
