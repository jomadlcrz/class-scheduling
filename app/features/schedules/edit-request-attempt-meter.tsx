type EditRequestAttemptMeterProps = {
  attemptsUsed: number;
  attemptLimit: number;
  limitOnly?: boolean;
  label?: string;
  showCount?: boolean;
  caption?: string;
  className?: string;
};

/**
 * One shared visual language for Major Scheduling edit-request limits.
 * The segmented bar makes the deliberately small limit easier to scan
 * than a percentage-based progress bar would.
 */
export function EditRequestAttemptMeter({
  attemptsUsed,
  attemptLimit,
  limitOnly = false,
  label = "Edit request limit",
  showCount = false,
  caption,
  className,
}: EditRequestAttemptMeterProps) {
  const configuredLimit = Number.isFinite(attemptLimit)
    ? Math.max(0, Math.floor(attemptLimit))
    : 0;
  const limit = Math.max(1, configuredLimit);
  const unlimited = limitOnly && configuredLimit === 0;
  const used = Number.isFinite(attemptsUsed)
    ? Math.min(limit, Math.max(0, Math.floor(attemptsUsed)))
    : 0;
  const remaining = Math.max(0, limit - used);
  const exhausted = !limitOnly && remaining === 0;
  const filledClass = exhausted
    ? "bg-rose-500 dark:bg-rose-400"
    : "bg-navy-700 dark:bg-navy-300";

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.035] ${className ?? ""}`.trim()}
    >
      {showCount ? (
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p
            className={`shrink-0 font-body text-xs font-bold tabular-nums ${
              exhausted
                ? "text-rose-700 dark:text-rose-300"
                : "text-navy-800 dark:text-mist-100"
            }`}
            aria-label={`${used} out of ${limit}`}
          >
            {used}/{limit}
          </p>
        </div>
      ) : (
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}

      <div
        className="mt-2 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${limit}, minmax(0, 1fr))` }}
        role={limitOnly ? "img" : "progressbar"}
        aria-label={
          limitOnly
            ? unlimited
              ? `${label} is unlimited`
              : `${label} with ${limit} segments`
            : `${used} out of ${limit} edit-request attempts used`
        }
        aria-valuemin={limitOnly ? undefined : 0}
        aria-valuemax={limitOnly ? undefined : limit}
        aria-valuenow={limitOnly ? undefined : used}
      >
        {Array.from({ length: limit }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`h-1.5 rounded-full transition-colors ${
              !unlimited && (limitOnly || index < used)
                ? filledClass
                : "bg-slate-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>

      {caption ? (
        <p className="mt-2 border-t border-slate-200 pt-2 font-body text-[11px] leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
