import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { MoonIcon, SunIcon } from "~/components/ui/icons";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useTheme } from "~/hooks/use-theme";

export function StudentMobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { context: termContext } = useTermContext();

  const selected = termContext?.selection;
  const activeTermLabel = selected?.schoolYear
    ? `${selected.semesterNumber === 1 ? "1st Sem" : selected.semesterNumber === 2 ? "2nd Sem" : "Summer"} · ${selected.schoolYear}`
    : "Student Portal";

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md dark:border-white/10 dark:bg-surface/95 lg:hidden">
      {/* Left: Branding */}
      <Link to="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg">
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC Logo"
          className="h-7 w-auto object-contain dark:hidden"
        />
        <img
          src="/images/logos/gwc-logo-white.avif"
          alt="GWC Logo"
          className="hidden h-7 w-auto object-contain dark:block"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-navy-700 dark:text-mist-100">
            GWC <span className="text-slate-600 dark:text-slate-300">Student</span>
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Portal
          </span>
        </div>
      </Link>

      {/* Right: Active Term Chip & Theme Toggle */}
      <div className="flex items-center gap-2">
        <Badge tone="slate">
          {activeTermLabel}
        </Badge>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:bg-surface-raised dark:hover:text-mist-100"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
