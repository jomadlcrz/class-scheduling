type BrandLockupProps = {
  /** Swap to the white logo in dark mode (over the navy drawer/branding panel). */
  whiteOnDark?: boolean;
  /** Header-over-hero state: light text that reads on the translucent bar. */
  scrolled?: boolean;
};

/** Logo + name lockup — left-aligned. Shared by the landing header and the
 * mobile menu drawer so the wordmark stays identical between them. */
export function BrandLockup({ whiteOnDark = false, scrolled = false }: BrandLockupProps) {
  return (
    <div className="flex items-center gap-3">
      <a
        href="/"
        aria-label="GWC Class Scheduling — home"
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          width={36}
          height={36}
          loading="eager"
          className={`size-8 object-contain sm:size-9 ${whiteOnDark ? "dark:hidden" : ""}`}
        />
        {whiteOnDark && (
          <img
            src="/images/logos/gwc-logo-white.avif"
            alt="GWC logo"
            width={36}
            height={36}
            loading="eager"
            className="hidden size-8 object-contain dark:block sm:size-9"
          />
        )}
      </a>
      <span className="flex flex-col items-center text-center leading-none">
        <span className={`font-display text-2xl tracking-wide sm:text-[1.7rem] ${scrolled ? "text-white dark:text-mist-100" : "text-navy-700 dark:text-mist-100"}`}>
          GWC
        </span>
        <span className={`-mt-2 font-body text-[0.65rem] tracking-wide sm:text-xs ${scrolled ? "text-gwc-blue-soft dark:text-navy-300" : "text-navy-500 dark:text-navy-300"}`}>
          Class Scheduling
        </span>
      </span>
    </div>
  );
}
