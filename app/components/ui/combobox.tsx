import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import * as React from "react";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "~/components/ui/icons";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({ className = "", children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-mist-100 ${className}`.trim()}
      {...props}
    >
      {children}
      <ChevronDownIcon />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className = "", children, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-mist-100 ${className}`.trim()}
      {...props}
    >
      {children ?? <CloseIcon />}
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className = "",
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & { showTrigger?: boolean; showClear?: boolean }) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={`flex w-full items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 transition-colors duration-150 has-focus-visible:border-gold-400 has-focus-visible:ring-2 has-focus-visible:ring-gold-400 has-aria-invalid:border-red-500 dark:border-white/15 dark:bg-white/5 dark:has-focus-visible:border-gold-400 ${className}`.trim()}
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        disabled={disabled}
        className="min-h-6 min-w-0 flex-1 bg-transparent px-1 font-body text-sm text-navy-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-mist-100 dark:placeholder:text-slate-500"
        {...props}
      />
      {showClear && <ComboboxClear disabled={disabled} />}
      {showTrigger && <ComboboxTrigger disabled={disabled} />}
      {children}
    </ComboboxPrimitive.InputGroup>
  );
}

function ComboboxContent({
  className = "",
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        collisionPadding={8}
        className="z-[120] outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={`group/combobox-content max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-(--anchor-width) overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised ${className}`.trim()}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className = "", ...props }: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" className={`max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto p-1 outline-none ${className}`.trim()} {...props} />;
}

function ComboboxItem({ className = "", children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={`relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-3 pr-8 font-body text-sm text-navy-800 outline-none data-highlighted:bg-slate-100 data-disabled:pointer-events-none data-disabled:opacity-50 dark:text-mist-100 dark:data-highlighted:bg-white/10 ${className}`.trim()}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ComboboxPrimitive.ItemIndicator className="absolute right-2 shrink-0 text-blue-700 dark:text-blue-400">
        <CheckIcon />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}


function ComboboxEmpty({ className = "", ...props }: ComboboxPrimitive.Empty.Props) {
  return <ComboboxPrimitive.Empty data-slot="combobox-empty" className={`hidden px-3 py-6 text-center font-body text-sm text-slate-400 group-data-empty/combobox-content:block dark:text-slate-500 ${className}`.trim()} {...props} />;
}

function ComboboxChips({ className = "", ...props }: ComboboxPrimitive.Chips.Props) {
  return <ComboboxPrimitive.Chips data-slot="combobox-chips" className={`flex min-h-8.5 w-full flex-wrap items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-body text-sm transition-colors duration-150 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400 has-aria-invalid:border-red-500 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-gold-400 ${className}`.trim()} {...props} />;
}

function ComboboxChip({
  className = "",
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & { showRemove?: boolean }) {
  return (
    <ComboboxPrimitive.Chip data-slot="combobox-chip" className={`inline-flex items-center gap-1 rounded-md bg-navy-500/10 px-1.5 py-0.5 text-xs font-medium text-navy-600 has-disabled:cursor-not-allowed has-disabled:opacity-50 dark:bg-navy-300/20 dark:text-slate-200 ${className}`.trim()} {...props}>
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove data-slot="combobox-chip-remove" className="-mr-0.5 grid size-4 cursor-pointer place-items-center rounded-sm text-navy-400 outline-none transition-colors hover:text-navy-700 focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-mist-100">
          <CloseIcon size={12} />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({ className = "", ...props }: ComboboxPrimitive.Input.Props) {
  return <ComboboxPrimitive.Input data-slot="combobox-chips-input" className={`min-w-16 flex-1 bg-transparent px-1 font-body text-sm text-navy-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-mist-100 dark:placeholder:text-slate-500 ${className}`.trim()} {...props} />;
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
