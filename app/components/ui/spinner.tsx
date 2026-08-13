export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Centered loading state for tables that render paginated results. */
export function TableLoadingSpinner({ label = "Loading table…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid min-h-64 place-items-center text-navy-700 dark:text-slate-200"
    >
      <Spinner size={24} />
    </div>
  );
}
