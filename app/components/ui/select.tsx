import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "~/components/ui/icons";

const Select = SelectPrimitive.Root;

function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ className = "", ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value data-slot="select-value" className={`block truncate ${className}`.trim()} {...props} />
  );
}

function SelectTrigger({ className = "", children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-sm text-gray-900 outline-none transition-colors duration-150 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700/20 data-popup-open:border-blue-700 data-popup-open:ring-2 data-popup-open:ring-blue-700/20 data-placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20 dark:data-popup-open:border-blue-400 dark:data-popup-open:ring-blue-400/20 dark:data-placeholder:text-slate-500 ${className}`.trim()}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        data-slot="select-trigger-icon"
        className="shrink-0 text-slate-400 transition-transform duration-150 data-popup-open:rotate-180 dark:text-slate-500"
      >
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpArrow(props: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up"
      className="flex h-6 cursor-default items-center justify-center bg-white text-slate-400 dark:bg-surface-raised dark:text-slate-500"
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownArrow(props: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down"
      className="flex h-6 cursor-default items-center justify-center bg-white text-slate-400 dark:bg-surface-raised dark:text-slate-500"
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

function SelectContent({
  className = "",
  children,
  alignItemWithTrigger = false,
  sideOffset = 6,
  ...props
}: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, "alignItemWithTrigger" | "sideOffset">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        data-slot="select-positioner"
        alignItemWithTrigger={alignItemWithTrigger}
        sideOffset={sideOffset}
        collisionPadding={8}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={`max-h-(--available-height) min-w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised ${className}`.trim()}
          {...props}
        >
          <SelectScrollUpArrow />
          <SelectPrimitive.List data-slot="select-list" className="outline-none">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownArrow />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel(props: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className="px-3 py-1.5 font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
      {...props}
    />
  );
}

function SelectItem({ className = "", children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={`relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none focus:bg-slate-100 data-disabled:pointer-events-none data-disabled:opacity-50 dark:text-mist-100 dark:focus:bg-white/10 ${className}`.trim()}
      {...props}
    >
      <SelectPrimitive.ItemText data-slot="select-item-text" className="truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="shrink-0 text-blue-700 dark:text-blue-400"
      >
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator(props: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className="-mx-1 my-1 h-px bg-slate-200 dark:bg-white/10"
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
