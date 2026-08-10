import { NavLink } from "react-router";

const underlineTabClassName = (isActive: boolean) =>
  `-mb-px border-b-2 px-4 py-2.5 font-body text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "border-navy-800 text-navy-800 dark:border-white dark:text-mist-100"
      : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
  }`;

type TabLink = {
  to: string;
  label: string;
  end?: boolean;
};

type TabLinksProps = {
  ariaLabel?: string;
  tabs: TabLink[];
  className?: string;
};

/** Underline tabs that track the active route (Departments · Sets, Students, …). */
export function TabLinks({ ariaLabel, tabs, className }: TabLinksProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={`flex gap-2 border-b border-slate-200 dark:border-white/10 ${className ?? ""}`.trim()}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => underlineTabClassName(isActive)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

type TabButtonOption<T extends string> = {
  value: T;
  label: string;
};

type TabButtonsProps<T extends string> = {
  ariaLabel?: string;
  tabs: TabButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Underline tabs driven by local state instead of routes. */
export function TabButtons<T extends string>({
  ariaLabel,
  tabs,
  value,
  onChange,
  className,
}: TabButtonsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-2 border-b border-slate-200 dark:border-white/10 ${className ?? ""}`.trim()}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={underlineTabClassName(value === tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
