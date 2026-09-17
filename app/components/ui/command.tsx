import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Command as CommandPrimitive } from "cmdk";
import type { ComponentProps, ReactNode } from "react";
import { CloseIcon, SearchIcon } from "~/components/ui/icons";

function Command({ className = "", ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={`flex h-full w-full flex-col overflow-hidden rounded-lg bg-white text-navy-800 dark:bg-surface-raised dark:text-mist-100 ${className}`.trim()}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run.",
  children,
  className = "",
  showCloseButton = true,
  ...props
}: Omit<DialogPrimitive.Root.Props, "children"> & {
  children?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-70 bg-navy-950/40 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-80 flex items-center justify-center p-4">
          <DialogPrimitive.Popup
            className={`relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl outline-none transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-white/10 dark:bg-surface-raised ${className}`.trim()}
          >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
            {showCloseButton && (
              <DialogPrimitive.Close className="absolute right-2 top-2 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-mist-100">
                <CloseIcon />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
            <Command>{children}</Command>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandInput({ className = "", ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-12 items-center gap-2 border-b border-slate-200 px-3 pr-11 dark:border-white/10">
      <span className="shrink-0 text-slate-400 dark:text-slate-500">
        <SearchIcon />
      </span>
      <CommandPrimitive.Input
        data-slot="command-input"
        className={`h-11 w-full bg-transparent font-body text-sm text-navy-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-mist-100 dark:placeholder:text-slate-500 ${className}`.trim()}
        {...props}
      />
    </div>
  );
}

function CommandList({ className = "", ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" className={`max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto ${className}`.trim()} {...props} />;
}

function CommandEmpty({ className = "", ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className={`py-6 text-center font-body text-sm text-slate-400 dark:text-slate-500 ${className}`.trim()} {...props} />;
}

function CommandGroup({ className = "", ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group data-slot="command-group" className={`overflow-hidden p-1 font-body text-navy-800 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-slate-500 dark:text-mist-100 dark:**:[[cmdk-group-heading]]:text-slate-400 ${className}`.trim()} {...props} />;
}

function CommandItem({ className = "", ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item data-slot="command-item" className={`relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 font-body text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-slate-100 data-[selected=true]:text-navy-800 dark:data-[selected=true]:bg-white/10 dark:data-[selected=true]:text-mist-100 ${className}`.trim()} {...props} />;
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
};

