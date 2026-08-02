import { Button } from "~/components/ui/button";
import { CheckIcon, LockIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import type { MockTermClosure } from "~/features/academic-terms/mock-data";
import { StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";

type TermClosureDetailsModalProps = {
  term: MockTermClosure | null;
  onClose: () => void;
};

const closedEffects = [
  "Grades are locked and cannot be edited.",
  "Enrollment records are protected from destructive changes.",
  "Schedules and faculty loads are locked.",
  "Reports will reflect this term as closed.",
  "Only viewing and printing are allowed.",
];

const sectionTitleClassName =
  "font-display text-sm tracking-wide text-navy-700 dark:text-mist-100";

const fieldLabelClassName =
  "font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500";

export function TermClosureDetailsModal({ term, onClose }: TermClosureDetailsModalProps) {
  if (!term) return null;

  const isClosed = term.status === "Closed";

  return (
    <Modal open={term !== null} onClose={onClose} title="Term Closure Details" wide>
      {/* Summary highlight */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-amber-600 shadow-sm dark:border-white/10 dark:bg-surface-raised dark:text-gold-400">
            <LockIcon />
          </span>

          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <dt className={fieldLabelClassName}>Status</dt>
              <dd className="mt-1.5">
                <StatusBadge tone={termStatusTone(term.status)}>{term.status}</StatusBadge>
                {term.closedReason && (
                  <p className="mt-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
                    {term.closedReason}
                  </p>
                )}
              </dd>
            </div>
            <SummaryItem label="School Year" value={term.schoolYear} />
            <SummaryItem label="Semester" value={term.semester} />
            <SummaryItem label="Closed At" value={term.closedAt ?? "—"} />
          </dl>
        </div>
      </div>

      {/* Term information */}
      <section className="mt-6">
        <h3 className={sectionTitleClassName}>Term Information</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <InfoItem label="School Year" value={term.schoolYear} />
          <InfoItem label="Semester" value={term.semester} />
          <InfoItem label="Semester Number" value={String(term.semesterNumber)} />
          <div>
            <dt className={fieldLabelClassName}>Status</dt>
            <dd className="mt-1.5">
              <StatusBadge tone={termStatusTone(term.status)}>{term.status}</StatusBadge>
            </dd>
          </div>
          <InfoItem label="Closed Reason" value={term.closedReason ?? "—"} />
          <InfoItem label="Closed By" value={term.closedBy ?? "—"} />
          <InfoItem label="Closed At" value={term.closedAt ?? "—"} className="md:col-span-2" />
        </dl>
      </section>

      {/* Closed-term effects */}
      {isClosed && (
        <section className="mt-6">
          <h3 className={sectionTitleClassName}>What Happens When This Term Is Closed</h3>
          <ul className="mt-3 space-y-2.5">
            {closedEffects.map((item) => (
              <li key={item} className="flex items-start gap-2.5 font-body text-sm text-slate-600 dark:text-slate-300">
                <span
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
                  aria-hidden="true"
                >
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Closure history */}
      {term.closedAt && (
        <section className="mt-6">
          <h3 className={sectionTitleClassName}>Closure History</h3>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div className="relative shrink-0 border-l-2 border-slate-200 pl-5 sm:w-52 dark:border-white/10">
              <span
                className="absolute -left-1.5 top-0.5 size-3 rounded-full bg-gwc-blue-bright"
                aria-hidden="true"
              />
              <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">{term.closedAt}</p>
              <p className="mt-0.5 font-body text-sm text-slate-600 dark:text-slate-300">{term.closedBy ?? "—"}</p>
            </div>

            <div className="min-w-0 flex-1 sm:border-l sm:border-slate-100 sm:pl-8 dark:sm:border-white/10">
              <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">Term was closed</p>
              {term.closedReason && (
                <p className="mt-2 font-body text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Reason: </span>
                  {term.closedReason}
                </p>
              )}
              {term.closedNotes && (
                <p className="mt-1 font-body text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Notes: </span>
                  {term.closedNotes}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
        <Button type="button" variant="outline" block={false} onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={fieldLabelClassName}>{label}</dt>
      <dd className="mt-1.5 font-body text-sm font-medium text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className={fieldLabelClassName}>{label}</dt>
      <dd className="mt-1.5 font-body text-sm text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}
