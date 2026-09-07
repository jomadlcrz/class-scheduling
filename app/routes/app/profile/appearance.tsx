import { useNavigate } from "react-router";
import { useTheme, type ThemePreference } from "~/components/theme/theme-provider";
import { ScreenHeader } from "~/components/ui/screen-header";

export function meta() {
  return [
    { title: "Appearance — GWC Class Scheduling" },
    { name: "description", content: "Customize appearance and theme preferences for the student portal." },
  ];
}

function MonitorIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function SunIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function CheckIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function InfoIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function AppearanceRoute() {
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();

  const options: Array<{
    id: ThemePreference;
    title: string;
    description: string;
    icon: typeof MonitorIcon;
  }> = [
    {
      id: "system",
      title: "Use system settings",
      description: "Automatically matches your device's system theme.",
      icon: MonitorIcon,
    },
    {
      id: "light",
      title: "Light mode",
      description: "Crisp white surface with high contrast readability.",
      icon: SunIcon,
    },
    {
      id: "dark",
      title: "Dark mode",
      description: "Deep slate background that is comfortable in dim environments.",
      icon: MoonIcon,
    },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-slate-50 dark:bg-surface">
      {/* Screen Header with Back Navigation */}
      <ScreenHeader
        title="Appearance"
        showBack
        onBack={() => navigate(-1)}
        className="border-b border-slate-200/90 bg-white dark:border-white/10 dark:bg-surface"
      />

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Customize how the app looks on your device.
          </p>

          <div className="space-y-4">
            {/* Theme Options Group */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white divide-y divide-slate-100 shadow-xs dark:border-white/10 dark:bg-surface dark:divide-white/5">
              {options.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = preference === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreference(opt.id)}
                    className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center transition-colors ${
                          isSelected
                            ? "text-gwc-blue dark:text-gwc-blue-soft"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <IconComponent size={20} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy-700 dark:text-mist-100">
                          {opt.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center pl-2">
                      <div
                        className={`flex size-5 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? "border-gwc-blue bg-gwc-blue text-white dark:border-gwc-blue-soft dark:bg-gwc-blue-soft dark:text-navy-950"
                            : "border-slate-300 bg-transparent dark:border-white/20"
                        }`}
                      >
                        {isSelected && <CheckIcon size={12} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Informative Guidance Box */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <InfoIcon size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <p className="leading-relaxed">
                Your theme selection is saved to this browser and will apply across all portal pages automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
