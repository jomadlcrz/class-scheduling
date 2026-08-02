import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { LockIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import type { MockTermClosure } from "~/features/academic-terms/mock-data";
import { closedReasonTone, StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";

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

export function TermClosureDetailsModal({ term, onClose }: TermClosureDetailsModalProps) {
  if (!term) return null;

  return (
    <Modal open={term !== null} onClose={onClose} title="Term Closure Details" wide>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-gold-400/25 dark:bg-gold-400/10">
        <span className="grid size-9 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-gold-400/20 dark:text-gold-300">
          <LockIcon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={termStatusTone(term.status)}>{term.status}</StatusBadge>
            {term.closedReason && (
              <StatusBadge tone={closedReasonTone(term.closedReason)}>{term.closedReason}</StatusBadge>
            )}
          </div>
          <p className="mt-1 font-body text-sm text-slate-600 dark:text-slate-300">
            {term.schoolYear} · {term.semester}
            {term.closedAt ? ` · Closed ${term.closedAt}` : ""}
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Term Information</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <InfoItem label="School Year" value={term.schoolYear} />
          <InfoItem label="Semester" value={term.semester} />
          <InfoItem label="Semester Number" value={String(term.semesterNumber)} />
          <div>
            <dt className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400">Status</dt>
            <dd className="mt-1">
              <StatusBadge tone={termStatusTone(term.status)}>{term.status}</StatusBadge>
            </dd>
          </div>
          <InfoItem label="Closed Reason" value={term.closedReason ?? "—"} />
          <InfoItem label="Closed By" value={term.closedBy ?? "—"} />
          <InfoItem label="Closed At" value={term.closedAt ?? "—"} className="sm:col-span-2" />
        </dl>
      </section>

      <section className="mt-6">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
          What Happens When This Term Is Closed
        </h3>
        <ul className="mt-3 space-y-2">
          {closedEffects.map((item) => (
            <li key={item} className="flex items-start gap-2 font-body text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {term.closedAt && (
        <section className="mt-6">
          <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Closure History</h3>
          <div className="relative mt-4 border-l-2 border-slate-200 pl-5 dark:border-white/10">
            <span className="absolute -left-1.25 top-1 size-2 rounded-full bg-gwc-blue-bright" aria-hidden="true" />
            <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">{term.closedAt}</p>
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">{term.closedBy ?? "—"}</p>
            <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">Term was closed</p>
            {term.closedReason && (
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">Reason: {term.closedReason}</p>
            )}
            {term.closedNotes && (
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">Notes: {term.closedNotes}</p>
            )}
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
      <dt className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}
