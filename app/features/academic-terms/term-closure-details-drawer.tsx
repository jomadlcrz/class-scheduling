import type { ReactNode } from "react";
import { LockIcon } from "~/components/ui/icons";
import { Drawer } from "~/components/ui/drawer";
import { ClosureEffectsPanel } from "~/features/academic-terms/closure-effects-panel";
import { StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";
import type { TermClosureItem } from "~/types/term-closure";

type TermClosureDetailsDrawerProps = {
  term: TermClosureItem | null;
  onClose: () => void;
};

const fieldLabelClassName =
  "font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500";

export function TermClosureDetailsDrawer({ term, onClose }: TermClosureDetailsDrawerProps) {
  if (!term) return null;

  const info = term.termInformation;
  const isClosed = term.status === "Closed";

  return (
    <Drawer
      open={term !== null}
      onClose={onClose}
      title={`${term.semesterDisplayName}, S.Y. ${term.schoolYear}`}
      description={term.closedReasonLabel ?? (isClosed ? "Closed term" : "Open term")}
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-amber-600 dark:border-white/10 dark:bg-surface-raised dark:text-gold-400">
            <LockIcon size={18} />
          </span>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3">
            <SummaryItem label="Status">
              <StatusBadge tone={termStatusTone(term.status)}>{term.status}</StatusBadge>
            </SummaryItem>
            <SummaryItem label="Closed at" value={term.closedAtDisplay ?? "—"} />
            <SummaryItem label="Closed by" value={term.closedBy?.display ?? "—"} className="col-span-2" />
          </dl>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Term information</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <SummaryItem label="School year" value={info.schoolYear} />
          <SummaryItem label="Semester" value={info.semester} />
          <SummaryItem label="Semester no." value={String(info.semesterNumber)} />
          <SummaryItem label="Reason" value={info.closedReasonLabel ?? "—"} />
        </dl>
      </section>

      {term.closureEffects.length > 0 && (
        <section className="mt-6">
          <ClosureEffectsPanel effects={term.closureEffects} variant="compact" />
        </section>
      )}

      {term.closureHistory.length > 0 && (
        <section className="mt-6">
          <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">History</h3>
          <ul className="mt-3 space-y-4">
            {term.closureHistory.map((entry, index) => (
              <li
                key={`${entry.closedAtDisplay ?? index}-${entry.headline}`}
                className="border-l-2 border-slate-200 pl-4 dark:border-white/10"
              >
                <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {entry.headline}
                </p>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  {entry.closedAtDisplay ?? "—"} · {entry.closedBy?.display ?? "—"}
                </p>
                {entry.notes && (
                  <p className="mt-1 font-body text-sm text-slate-600 dark:text-slate-300">{entry.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Drawer>
  );
}

function SummaryItem({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className={fieldLabelClassName}>{label}</dt>
      <dd className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{children ?? value}</dd>
    </div>
  );
}
