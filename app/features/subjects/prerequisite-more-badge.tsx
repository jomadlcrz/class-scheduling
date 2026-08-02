import { Badge } from "~/components/ui/badge";
import { Popover } from "~/components/ui/popover";

export type PrerequisiteMoreItem = {
  code: string;
  title?: string;
  /** When set with onRemove, shows a remove control in the popover. */
  id?: string;
};

type PrerequisiteMoreBadgeProps = {
  count: number;
  items: PrerequisiteMoreItem[];
  onRemove?: (id: string) => void;
};

const removeButtonClassName =
  "grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400";

export function PrerequisiteMoreBadge({ count, items, onRemove }: PrerequisiteMoreBadgeProps) {
  if (count <= 0 || items.length === 0) return null;

  return (
    <Popover
      label={`Show ${count} more prerequisite${count === 1 ? "" : "s"}`}
      trigger={<Badge tone="slate">+{count} more</Badge>}
      triggerClassName="cursor-pointer rounded-full p-0 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      className="w-56"
    >
      {() => (
        <>
          <p className="px-3 py-1 font-body text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Prerequisites
          </p>
          <ul className="py-0.5">
            {items.map((item) => (
              <li
                key={item.id ?? item.code}
                className="flex items-start justify-between gap-2 px-3 py-1.5 font-body text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="min-w-0">
                  <span className="font-medium text-navy-700 dark:text-mist-100">{item.code}</span>
                  {item.title ? (
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.title}
                    </span>
                  ) : null}
                </div>
                {onRemove && item.id ? (
                  <button
                    type="button"
                    aria-label={`Remove ${item.code}`}
                    className={removeButtonClassName}
                    onClick={() => onRemove(item.id!)}
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </Popover>
  );
}
