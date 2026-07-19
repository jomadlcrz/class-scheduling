import { type ReactNode } from "react";
import { MoreVerticalIcon } from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";

type DropdownItem = {
  label: string;
  icon?: ReactNode;
  /** "danger" renders the item in red (e.g. Delete). */
  tone?: "default" | "danger";
  onSelect: () => void;
};

type DropdownMenuProps = {
  /** Accessible name for the trigger button. */
  label: string;
  items: DropdownItem[];
};

/**
 * Kebab (⋮) actions menu — closes on outside click, Escape, or selection.
 * Built on Popover so the panel escapes overflow/scroll clipping.
 */
export function DropdownMenu({ label, items }: DropdownMenuProps) {
  return (
    <Popover
      label={label}
      trigger={<MoreVerticalIcon />}
      triggerClassName="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
      className="w-36 px-1.5"
    >
      {(close) =>
        items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              item.onSelect();
            }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md p-2.5 text-left font-body text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 [&>svg]:size-3.5 ${
              item.tone === "danger"
                ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))
      }
    </Popover>
  );
}
