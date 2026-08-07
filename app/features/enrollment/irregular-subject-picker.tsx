import { useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { BookmarkIcon } from "~/components/ui/icons";
import { SearchInput } from "~/components/ui/search-input";
import { EnrollmentSectionCard } from "~/features/enrollment/enrollment-section-card";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Subject } from "~/types/subject";

type IrregularSubjectPickerProps = {
  subjects: Subject[];
  selectedSubjectIds: Set<number>;
  onToggleSubject: (subjectId: number, checked: boolean) => void;
  /** Prefix for checkbox ids so add-student and re-enroll don't collide. */
  idPrefix: string;
};

type YearGroup = {
  yearLevel: number;
  label: string;
  subjects: Subject[];
};

/** Irregular enrollment subject list with search, grouped by year level. */
export function IrregularSubjectPicker({
  subjects,
  selectedSubjectIds,
  onToggleSubject,
  idPrefix,
}: IrregularSubjectPickerProps) {
  const [query, setQuery] = useState("");
  const { yearLevelLabel } = useYearLevels();

  const yearGroups = useMemo((): YearGroup[] => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? subjects
      : subjects.filter(
          (s) => s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q),
        );

    const byYear = new Map<number, Subject[]>();
    for (const s of filtered) {
      const list = byYear.get(s.yearLevel) ?? [];
      list.push(s);
      byYear.set(s.yearLevel, list);
    }

    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([yearLevel, yearSubjects]) => ({
        yearLevel,
        label: yearLevelLabel(yearLevel),
        subjects: yearSubjects,
      }));
  }, [subjects, query, yearLevelLabel]);

  return (
    <EnrollmentSectionCard title="Subjects for this term" icon={<BookmarkIcon />}>
      <SearchInput
        className="mb-3"
        value={query}
        onChange={setQuery}
        placeholder="Search by code or title…"
        ariaLabel="Search subjects"
      />

      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {subjects.length === 0 ? (
          <p className="font-body text-sm text-slate-500 dark:text-slate-400">
            No subjects found for this program and semester.
          </p>
        ) : yearGroups.length === 0 ? (
          <p className="font-body text-sm text-slate-500 dark:text-slate-400">
            No subjects match “{query.trim()}”.
          </p>
        ) : (
          yearGroups.map((group) => (
            <section key={group.yearLevel} aria-labelledby={`${idPrefix}-yl-${group.yearLevel}`}>
              <h3
                id={`${idPrefix}-yl-${group.yearLevel}`}
                className="sticky top-0 z-10 mb-1.5 border-b border-slate-100 bg-white px-2 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400"
              >
                {group.label}
              </h3>
              <div className="flex flex-col gap-1">
                {group.subjects.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/3"
                  >
                    <Checkbox
                      id={`${idPrefix}-subject-${s.id}`}
                      hideLabel
                      ariaLabel={`${s.code} — ${s.title}`}
                      checked={selectedSubjectIds.has(s.id)}
                      onChange={(checked) => onToggleSubject(s.id, checked)}
                    />
                    <label
                      htmlFor={`${idPrefix}-subject-${s.id}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="block font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                        {s.code}
                      </span>
                      <span className="block font-body text-xs text-slate-500 dark:text-slate-400">
                        {s.title} · {s.units} units
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </EnrollmentSectionCard>
  );
}
