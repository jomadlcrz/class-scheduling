import { useEffect, useState } from "react";
import { useTheme, type Theme } from "~/hooks/use-theme";
import { PageHeader } from "~/layouts/page-header";

type ThemeCard = {
  value: Theme;
  label: string;
  description: string;
};

const THEME_OPTIONS: ThemeCard[] = [
  {
    value: "light",
    label: "Light",
    description: "Clean, bright interface for well-lit environments.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes in low-light settings.",
  },
];

export function AppearanceSettings() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleSelect(value: Theme) {
    if (mounted && value !== theme) toggleTheme();
  }

  return (
    <div>
      <PageHeader title="Appearance" description="Choose how the interface looks on this device." />

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          {THEME_OPTIONS.map((option) => {
            const isSelected = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                aria-pressed={isSelected}
                className={`flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  isSelected
                    ? "border-navy-700 bg-navy-50 dark:border-gold-400 dark:bg-white/5"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/3 dark:hover:border-white/20"
                }`}
              >
                <ThemePreview variant={option.value} />
                <div>
                  <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                    {option.label}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <span className="self-start rounded-full bg-navy-700 px-2 py-0.5 font-body text-[0.6rem] font-medium uppercase tracking-wider text-white dark:bg-gold-400 dark:text-navy-900">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ variant }: { variant: Theme }) {
  if (variant === "light") {
    return (
      <div className="h-16 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex h-full gap-1 p-1">
          <div className="h-full w-10 rounded bg-navy-800" />
          <div className="flex flex-1 flex-col gap-1">
            <div className="h-3 w-full rounded border border-slate-200 bg-white" />
            <div className="flex flex-1 flex-col gap-1 p-1">
              <div className="h-1.5 w-3/4 rounded bg-slate-200" />
              <div className="h-1.5 w-1/2 rounded bg-slate-200" />
              <div className="h-1.5 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-950">
      <div className="flex h-full gap-1 p-1">
        <div className="h-full w-10 rounded border border-white/8 bg-navy-900" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-3 w-full rounded border border-white/8 bg-navy-900" />
          <div className="flex flex-1 flex-col gap-1 p-1">
            <div className="h-1.5 w-3/4 rounded bg-white/10" />
            <div className="h-1.5 w-1/2 rounded bg-white/10" />
            <div className="h-1.5 w-2/3 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
