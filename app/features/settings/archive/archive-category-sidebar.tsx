import { Card } from "~/components/ui/card";
import type { ArchiveTabConfig, ArchiveTabKey } from "~/features/settings/archive/constants";

type ArchiveCategorySidebarProps = {
  tabs: ArchiveTabConfig[];
  activeTab: ArchiveTabKey;
  counts: Record<ArchiveTabKey, number>;
  onSelect: (tab: ArchiveTabKey) => void;
};

export function ArchiveCategorySidebar({ tabs, activeTab, counts, onSelect }: ArchiveCategorySidebarProps) {
  return (
    <Card className="p-2">
      <nav aria-label="Archive categories" className="flex flex-col gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
              >
                <Icon />
              </span>
              <span className="min-w-0 flex-1 truncate">{tab.label}</span>
              <span
                className={`shrink-0 font-body text-xs tabular-nums ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </Card>
  );
}
