import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "~/components/ui/icons";

export type FilterOption = { value: string; label: string };

type FilterDropdownProps = {
  id?: string;
  label: string;
  allLabel: string;
  allValue?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
};

const itemClassName =
  "relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none data-[highlighted]:bg-slate-100 dark:text-white dark:data-[highlighted]:bg-white/10";

function FilterMenuItem({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="min-w-0 truncate">{children}</span>
      <Menu.RadioItemIndicator className="shrink-0 text-blue-700 dark:text-blue-400">
        <CheckIcon />
      </Menu.RadioItemIndicator>
    </>
  );
}

/**
 * A compact toolbar filter: collapses to just the field name when unset,
 * shows the picked value with an inline clear once a filter is active.
 */
export function FilterDropdown({
  id,
  label,
  allLabel,
  allValue = "all",
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  const isActive = value !== allValue;
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative flex min-w-0">
      <Menu.Root>
        <Menu.Trigger
          id={id}
          aria-label={isActive ? `${label}: ${selected?.label}` : label}
          className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
            isActive ? "py-2 pl-3 pr-7" : "px-3 py-2"
          } ${
            isActive
              ? "border-blue-700 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/15"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 data-popup-open:border-blue-700 data-popup-open:ring-2 data-popup-open:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:data-popup-open:border-blue-400 dark:data-popup-open:ring-blue-400/20"
          }`}
        >
          <span className="min-w-0 truncate">{isActive ? selected?.label : label}</span>
          <ChevronDownIcon />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="start" collisionPadding={8} className="z-50 outline-none">
            <Menu.Popup className="max-h-[60vh] min-w-40 max-w-(--available-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-navy-900">
              <Menu.RadioGroup value={value} onValueChange={(v) => onChange(v as string)}>
                <Menu.RadioItem value={allValue} closeOnClick className={itemClassName}>
                  <FilterMenuItem>{allLabel}</FilterMenuItem>
                </Menu.RadioItem>
                {options.map((option) => (
                  <Menu.RadioItem key={option.value} value={option.value} closeOnClick className={itemClassName}>
                    <FilterMenuItem>{option.label}</FilterMenuItem>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {isActive && (
        <button
          type="button"
          aria-label={`Clear ${label} filter`}
          onClick={(e) => {
            e.stopPropagation();
            onChange(allValue);
          }}
          className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-blue-700/70 transition-colors duration-150 hover:bg-blue-700/10 hover:text-blue-700 dark:text-blue-300/70 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
        >
          <CloseIcon size={12} />
        </button>
      )}
    </div>
  );
}
