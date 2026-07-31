/** "BSIT-1A" — program abbrev + year level + set code joined without separators. */
export function programSetLabel(
  programAbbrev: string | null | undefined,
  yearLevel: number | null | undefined,
  setCode: string | null | undefined,
): string | null {
  const parts = [programAbbrev, [yearLevel, setCode].filter((v) => v != null).join("")].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : null;
}
