import { useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { usePagination } from "~/hooks/use-pagination";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularStudentListProps = {
  students: IrregularStudent[];
  selectedStudentProfileIds: Set<number>;
  onToggleSelection: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenSingle: (student: IrregularStudent) => void;
};

export function IrregularStudentList({
  students,
  selectedStudentProfileIds,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onOpenSingle,
}: IrregularStudentListProps) {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const programs = useMemo(
    () => [...new Set(students.map((s) => s.programTaken).filter(Boolean))].sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      if (programFilter !== "all" && s.programTaken !== programFilter) return false;
      if (
        query &&
        !(s.studentId ?? "").toLowerCase().includes(query) &&
        !s.studentName.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [students, search, programFilter]);

  const pagination = usePagination(filtered, `${search}|${programFilter}`);
  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedStudentProfileIds.has(s.studentProfileId));
  const selectedCount = selectedStudentProfileIds.size;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
          Irregular Students
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={allFilteredSelected ? onDeselectAll : onSelectAll}
            className="font-body text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-100"
          >
            {allFilteredSelected ? "Deselect all" : "Select all"}
          </button>
          {selectedCount > 0 && (
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {selectedCount} selected
            </span>
          )}
        </div>
      </div>

      <div className="relative shrink-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <SearchIcon />
        </span>
        <input
          type="search" placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClassName} pl-9`}
          aria-label="Search irregular students"
        />
      </div>

      <div className="shrink-0">
        <Select
          items={[{ value: "all", label: "All programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
          value={programFilter}
          onValueChange={(v) => setProgramFilter(v as string)}
        >
          <SelectTrigger aria-label="Filter by program">
            <SelectValue placeholder="All programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-2 py-6 text-center font-body text-sm text-slate-400 dark:text-slate-500">
            {students.length ? "No students match your filter." : "No irregular students found."}
          </li>
        ) : (
          pagination.pageItems.map((student) => {
            const isSelected = selectedStudentProfileIds.has(student.studentProfileId);
            return (
              <li key={student.studentProfileId}>
                <div
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? "border-navy-700 bg-navy-700/5 dark:border-gold-400 dark:bg-gold-400/10"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                  onClick={() => onOpenSingle(student)}
                >
                  <span className="flex shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`irreg-cb-${student.studentProfileId}`}
                      name={`irreg-cb-${student.studentProfileId}`}
                      checked={isSelected}
                      onChange={() => onToggleSelection(student.studentProfileId)}
                    />
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="truncate font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                      {student.studentName}
                    </span>
                    <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                      {student.studentId ? `${student.studentId} · ` : ""}
                      {student.programTaken || "—"}
                    </span>
                  </span>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="shrink-0">
        <Pagination
          page={pagination.page}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  );
}
