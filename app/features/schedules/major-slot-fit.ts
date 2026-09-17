export const MINIMUM_MEETING_HOURS = 1;

export function formatHoursLabel(hours: number): string {
  if (hours <= 0) return "0 hrs";
  const whole = Math.floor(hours);
  const frac = hours - whole;
  if (frac === 0) return `${whole} hr${whole === 1 ? "" : "s"}`;
  if (frac === 0.5) return `${whole > 0 ? `${whole} ` : ""}1.5 hrs`;
  return `${hours.toFixed(1)} hrs`;
}
