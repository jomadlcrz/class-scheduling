/** Generic placeholder shown until a department uploads a logo, or if one fails to load. */
const NO_LOGO = "/images/departments/no-logo.avif";

/** Static, convention-based icon (`/images/departments/<code>.avif`) for call sites that
 * only ever have a department code on hand (faculty/dean/set rows, curriculum headers, …) —
 * they don't fetch a full `Department` record, so there's no backend `logoUrl` to read. */
export function departmentLogoUrl(code: string): string {
  return `/images/departments/${code.toLowerCase()}.avif`;
}

/** The real, backend-hosted logo (departments admin — list/table/grid/form all carry the
 * fetched `Department.logoUrl`). Falls back to the same generic placeholder when unset. */
export function departmentLogoSrc(logoUrl: string | null | undefined): string {
  return logoUrl || NO_LOGO;
}

export function onDepartmentLogoError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (!img.src.endsWith(NO_LOGO)) {
    img.src = NO_LOGO;
  }
}
