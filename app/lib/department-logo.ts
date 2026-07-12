const NO_LOGO = "/images/departments/no-logo.avif";

export function departmentLogoUrl(code: string): string {
  return `/images/departments/${code.toLowerCase()}.avif`;
}

export function onDepartmentLogoError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== NO_LOGO) {
    img.src = NO_LOGO;
  }
}
