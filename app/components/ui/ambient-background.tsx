/** Shared radial-gradient atmosphere behind full-page surfaces. One recipe —
 * blueprint grid + gold and navy glows — so landing, auth, and legal pages read
 * as the same brand. Colors come from the design tokens (the gold is the real
 * `--color-gold-400`, not the muted off-gold the copies used to hardcode).
 *
 * - `landing` adds the faint cover photo and a bottom fade into the surface, and
 *   pins with `sm:fixed` (mobile keeps it absolute so it scrolls with content).
 * - `page` is the plain fixed backdrop (legal/marketing sub-pages).
 */
type AmbientVariant = "landing" | "page";

const GOLD_GLOW = "radial-gradient(circle, var(--color-gold-400) 0%, transparent 65%)";
const NAVY_GLOW = "radial-gradient(circle, var(--color-navy-500) 0%, transparent 65%)";

export function AmbientBackground({ variant = "page" }: { variant?: AmbientVariant }) {
  const positioning = variant === "landing" ? "absolute inset-0 z-0 sm:fixed" : "fixed inset-0 z-0";

  return (
    <div aria-hidden="true" className={`pointer-events-none ${positioning}`}>
      {variant === "landing" && (
        <img
          src="/images/covers/home-cover.avif"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-[0.06] dark:opacity-[0.10]"
        />
      )}

      {/* Blueprint timetable grid — the signature texture, now on every surface. */}
      <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-mist-100/5" />

      {/* Gold radial glow, top-center. */}
      <div
        className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-20 dark:opacity-[0.14]"
        style={{ background: GOLD_GLOW }}
      />

      {/* Navy depth glow, lower-left. */}
      <div
        className="absolute top-1/3 -left-32 size-128 opacity-[0.14] dark:opacity-20"
        style={{ background: NAVY_GLOW }}
      />

      {variant === "landing" && (
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-cream-50 to-transparent dark:from-surface" />
      )}
    </div>
  );
}
