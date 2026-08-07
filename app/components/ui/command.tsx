import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { useState, type ComponentProps } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "~/components/ui/icons";

const Command = ComboboxPrimitive.Root;

type CommandInputProps = ComboboxPrimitive.Input.Props & {
  /** Shown while focused, in place of `placeholder` (e.g. "Search faculty…"). */
  focusPlaceholder?: string;
  /** Render without outer border — for embedding inside a custom field shell (e.g. tag inputs). */
  embedded?: boolean;
};

function CommandInput({
  className = "",
  placeholder,
  focusPlaceholder,
  embedded = false,
  onFocus,
  onBlur,
  ...props
}: CommandInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <ComboboxPrimitive.InputGroup
      data-slot="command-input-group"
      className={
        embedded
          ? "flex min-w-0 flex-1 items-center gap-2 bg-transparent"
          : "flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 transition-colors duration-150 has-focus-visible:border-gold-400 has-focus-visible:ring-2 has-focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:has-focus-visible:border-gold-400"
      }
    >
      <ComboboxPrimitive.Input
        data-slot="command-input"
        placeholder={focused ? (focusPlaceholder ?? placeholder) : placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`w-full bg-transparent font-body text-sm text-gray-900 outline-none placeholder-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-mist-100 dark:placeholder-slate-500 ${className}`.trim()}
        {...props}
      />
      <span className="shrink-0 text-slate-400 dark:text-slate-500">
        {focused ? <SearchIcon /> : <ChevronDownIcon />}
      </span>
    </ComboboxPrimitive.InputGroup>
  );
}

function CommandList({ className = "", children, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="command-positioner"
        sideOffset={6}
        collisionPadding={8}
        className="z-50 outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="command-list"
          className={`max-h-(--available-height) min-w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised ${className}`.trim()}
          {...props}
        >
          <ComboboxPrimitive.List data-slot="command-list-items" className="outline-none">
            {children}
          </ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function CommandEmpty({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      role="status"
      className={`px-3 py-6 text-center font-body text-sm text-slate-400 dark:text-slate-500 ${className}`.trim()}
      {...props}
    />
  );
}

function CommandItem({ className = "", children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="command-item"
      className={`relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none data-highlighted:bg-slate-100 data-disabled:pointer-events-none data-disabled:opacity-50 dark:text-mist-100 dark:data-highlighted:bg-white/10 ${className}`.trim()}
      {...props}
    >
      <span className="truncate">{children}</span>
      <ComboboxPrimitive.ItemIndicator
        data-slot="command-item-indicator"
        className="shrink-0 text-blue-700 dark:text-blue-400"
      >
        <CheckIcon />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandItem };
