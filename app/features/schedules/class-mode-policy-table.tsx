import { Badge } from "~/components/ui/badge";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { ModeBadge } from "~/features/schedules/mode-badge";
import type { ClassModePolicy } from "~/services/schedule.service";

const actionBtn =
  "grid size-7 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** The three rungs of the ladder, narrowest last — the order they win in. */
const SCOPE_LABEL: Record<ClassModePolicy["scope"], string> = {
  subject_type: "Subject type",
  subject: "Subject",
  section: "Section",
};

function target(row: ClassModePolicy): string {
  if (row.scope === "subject_type") return row.subjectType ?? "—";
  const subject = row.subjectCode ?? `Subject ${row.subjectId}`;
  return row.scope === "section" ? `${subject} · ${row.setName ?? "—"}` : subject;
}

export function ClassModePolicyTable({
  policies,
  onEdit,
  onDelete,
}: {
  policies: ClassModePolicy[];
  onEdit: (policy: ClassModePolicy) => void;
  onDelete: (policy: ClassModePolicy) => void;
}) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
      <table className="w-full border-collapse text-left font-body text-sm">
        <thead className="border-b-2 border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-surface-raised">
          <tr>
            <th className="px-3 py-2 font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Applies to
            </th>
            <th className="px-3 py-2 font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Target
            </th>
            <th className="px-3 py-2 text-center font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Delivered
            </th>
            <th className="px-3 py-2 font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Note
            </th>
            <th className="px-3 py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {policies.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-200 transition-colors duration-150 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <td className="px-3 py-3">
                <Badge tone="slate">
                  {SCOPE_LABEL[row.scope]}
                </Badge>
              </td>
              <td className="px-3 py-3 font-medium text-navy-700 dark:text-mist-100">
                {target(row)}
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center justify-center gap-1.5">
                  <ModeBadge mode={row.classMode} />
                  {row.classMode === "Blended" && (
                    <span className="whitespace-nowrap font-body text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.onlineMeetings} online/wk
                    </span>
                  )}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                {row.note || "—"}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className={actionBtn}
                    aria-label={`Edit policy for ${target(row)}`}
                    onClick={() => onEdit(row)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className={actionBtn}
                    aria-label={`Delete policy for ${target(row)}`}
                    onClick={() => onDelete(row)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
