export function formatSectionSetName(
  programAbbrev: string,
  yearLevel: number,
  setCode: string,
): string {
  return `${programAbbrev} ${yearLevel}-${setCode}`;
}
