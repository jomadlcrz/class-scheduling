type StudentAvatarProps = {
  firstName?: string;
  lastName?: string;
  /** Local blob/object URL or remote profile photo URL. */
  photoUrl?: string | null;
  size?: "md" | "lg";
};

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim().charAt(0) ?? "";
  const b = lastName?.trim().charAt(0) ?? "";
  const value = `${a}${b}`.toUpperCase();
  return value || "?";
}

/** Avatar with optional photo preview; falls back to initials. */
export function StudentAvatar({ firstName, lastName, photoUrl, size = "lg" }: StudentAvatarProps) {
  const dim = size === "lg" ? "size-24 text-2xl" : "size-14 text-lg";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${dim} rounded-full object-cover ring-4 ring-slate-100 dark:ring-white/10`}
      />
    );
  }
  return (
    <div
      className={`grid ${dim} place-items-center rounded-full bg-linear-to-br from-navy-700 to-navy-900 font-display font-semibold tracking-wide text-white ring-4 ring-slate-100 dark:from-navy-600 dark:to-navy-800 dark:ring-white/10`}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </div>
  );
}
