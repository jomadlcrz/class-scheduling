import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu } from "~/components/ui/dropdown";
import { EmptyState } from "~/components/ui/empty-state";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import {
  SEMESTER_LABELS,
  SEMESTERS,
  YEAR_LEVEL_LABELS,
  YEAR_LEVELS,
  type CreateSubjectInput,
  type Subject,
  type SubjectType,
} from "~/types/subject";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";

export type PendingEntry = CreateSubjectInput & { tempId: string };

type StructureRow = {
  key: string;
  code: string;
  title: string;
  units: number;
  lectureHours: number;
  labHours: number;
  subjectType: SubjectType;
  prerequisiteIds: string[];
  /** Set only for unsaved entries — they're highlighted and editable. */
  tempId?: string;
};

type CurriculumStructureProps = {
  program: string;
  /** Saved subjects of the program. */
  saved: Subject[];
  /** Unsaved entries added in this session. */
  pending: PendingEntry[];
  onEditPending: (tempId: string) => void;
  onRemovePending: (tempId: string) => void;
};

/** Year → semester breakdown of a program's curriculum, with unsaved entries highlighted. */
export function CurriculumStructure({
  program,
  saved,
  pending,
  onEditPending,
  onRemovePending,
}: CurriculumStructureProps) {
  const codeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of saved) map.set(s.id, s.code);
    for (const p of pending) map.set(p.tempId, p.code);
    return map;
  }, [saved, pending]);

  const rows: (StructureRow & { yearLevel: number; semester: number })[] = [
    ...saved.map((s) => ({ ...s, key: s.id })),
    ...pending.map((p) => ({ ...p, key: p.tempId, tempId: p.tempId })),
  ];

  if (rows.length === 0) {
    return (
      <EmptyState title="No subjects yet">
        {program} has no curriculum entries. Add subjects using the form.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {YEAR_LEVELS.map((year) => {
        const yearRows = rows.filter((r) => r.yearLevel === year);
        if (yearRows.length === 0) return null;
        const yearUnits = yearRows.reduce((sum, r) => sum + r.units, 0);

        return (
          <section key={year}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
                {YEAR_LEVEL_LABELS[year]}
              </h3>
              <Badge tone="navy">{yearUnits} units</Badge>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              {SEMESTERS.map((semester) => {
                const semesterRows = yearRows.filter((r) => r.semester === semester);
                if (semesterRows.length === 0) return null;
                const semesterUnits = semesterRows.reduce((sum, r) => sum + r.units, 0);

                return (
                  <div
                    key={semester}
                    className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-navy-800/60 rounded-t-xl">
                      <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                        {SEMESTER_LABELS[semester]}
                      </p>
                      <Badge tone="slate">{semesterUnits} units</Badge>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-white/10">
                      {semesterRows.map((row) => (
                        <li
                          key={row.key}
                          className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 font-body text-sm ${
                            row.tempId ? "bg-gold-400/10" : ""
                          }`}
                        >
                          <span className="w-24 shrink-0 font-medium text-navy-700 dark:text-white">
                            {row.code}
                          </span>
                          {/* min-w keeps the title from collapsing; overflowing
                              meta wraps to the next line instead. */}
                          <span className="min-w-40 flex-1 text-slate-600 dark:text-slate-300">
                            {row.title}
                          </span>
                          <span className="shrink-0 text-slate-500 dark:text-slate-400">
                            {row.units} units · {row.lectureHours} lec
                            {row.labHours > 0 && ` / ${row.labHours} lab`}
                          </span>
                          <span className="shrink-0">
                            <SubjectTypeBadge type={row.subjectType} />
                          </span>
                          <span className="flex shrink-0 flex-wrap gap-1">
                            {row.prerequisiteIds.map((id) => (
                              <Badge key={id} tone="slate">
                                {codeById.get(id) ?? id}
                              </Badge>
                            ))}
                          </span>
                          {row.tempId ? (
                            <span className="flex shrink-0 items-center gap-1.5">
                              <Badge tone="gold">New</Badge>
                              <DropdownMenu
                                label={`Actions for ${row.code}`}
                                items={[
                                  {
                                    label: "Edit",
                                    icon: <EditIcon />,
                                    onSelect: () => onEditPending(row.tempId!),
                                  },
                                  {
                                    label: "Delete",
                                    icon: <TrashIcon />,
                                    tone: "danger",
                                    onSelect: () => onRemovePending(row.tempId!),
                                  },
                                ]}
                              />
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
