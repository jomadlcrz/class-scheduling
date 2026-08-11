export function emailLink(email: string | null | undefined, className?: string) {
  if (!email) return "—";
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}

export function mobileLink(mobile: string | null | undefined, className?: string) {
  if (!mobile) return "—";
  return (
    <a href={`tel:${mobile}`} className={className}>
      {mobile}
    </a>
  );
}
