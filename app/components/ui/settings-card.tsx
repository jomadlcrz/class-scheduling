import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

type SettingsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Right-aligned action(s) in a divided footer strip, e.g. a save button. */
  footer?: ReactNode;
};

/** Boxed settings section: header + content, with an optional footer action bar. */
export function SettingsCard({ title, description, children, footer }: SettingsCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-white/8">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">{title}</h2>
        {description && (
          <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-white/8 dark:bg-white/3">
          {footer}
        </div>
      )}
    </Card>
  );
}
