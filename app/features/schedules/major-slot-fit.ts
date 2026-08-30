import { timeToMinutes } from "~/lib/time";

export const MINIMUM_MEETING_HOURS = 1;

export type SlotFitResult = {
  valid: boolean;
  actualHours: number;
  expectedHours: number;
  differenceHours: number;
  reason?: string;
};

export function formatHoursLabel(hours: number): string {
  if (hours <= 0) return "0 hrs";
  const whole = Math.floor(hours);
  const frac = hours - whole;
  if (frac === 0) return `${whole} hr${whole === 1 ? "" : "s"}`;
  if (frac === 0.5) return `${whole > 0 ? `${whole} ` : ""}1.5 hrs`;
  return `${hours.toFixed(1)} hrs`;
}

export function slotFitForSubject(
  startTime: string,
  endTime: string,
  expectedHours: number,
): SlotFitResult {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const durationMins = Math.max(0, endMins - startMins);
  const actualHours = durationMins / 60;
  const differenceHours = Math.round((actualHours - expectedHours) * 100) / 100;

  if (actualHours < MINIMUM_MEETING_HOURS) {
    return {
      valid: false,
      actualHours,
      expectedHours,
      differenceHours,
      reason: `Meeting must be at least ${MINIMUM_MEETING_HOURS} hour long.`,
    };
  }

  if (actualHours > expectedHours) {
    return {
      valid: false,
      actualHours,
      expectedHours,
      differenceHours,
      reason: `Selection of ${formatHoursLabel(actualHours)} exceeds required ${formatHoursLabel(expectedHours)}.`,
    };
  }

  return {
    valid: true,
    actualHours,
    expectedHours,
    differenceHours,
  };
}
