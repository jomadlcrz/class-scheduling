import { useEffect, useRef } from "react";
import { NavLink } from "react-router";

const underlineTabClassName = (isActive: boolean) =>
  `relative shrink-0 whitespace-nowrap px-4 py-2.5 font-body text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "text-navy-800 dark:text-white"
      : "text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
  }`;

const underlineFillBarClassName = (isActive: boolean) =>
  `pointer-events-none absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-navy-800 transition-all duration-700 dark:bg-white ${
    isActive ? "w-full" : "w-0"
  }`;

const scrollContainerClassName =
  "max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const tabsRowClassName = "relative flex w-max min-w-full gap-2";

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
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const active = containerRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel}
      className={`${scrollContainerClassName} ${className ?? ""}`.trim()}
    >
      <div className={tabsRowClassName}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-slate-200 dark:bg-white/10"
        />
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => underlineTabClassName(isActive)}
          >
            {({ isActive }) => (
              <>
                {tab.label}
                <span className={underlineFillBarClassName(isActive)} />
              </>
            )}
          </NavLink>
        ))}
      </div>
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const active = containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`${scrollContainerClassName} ${className ?? ""}`.trim()}
    >
      <div className={tabsRowClassName}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-slate-200 dark:bg-white/10"
        />
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
            <span className={underlineFillBarClassName(value === tab.value)} />
          </button>
        ))}
      </div>
    </div>
  );
}
