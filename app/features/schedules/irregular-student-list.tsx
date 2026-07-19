import { useMemo, useState } from "react";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { Radio } from "~/components/ui/radio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { usePagination } from "~/hooks/use-pagination";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularStudentListProps = {
  students: IrregularStudent[];
  selectedStudentProfileId: number | null;
  onSelect: (student: IrregularStudent) => void;
};

export function IrregularStudentList({
  students,
  selectedStudentProfileId,
  onSelect,
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

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
        Irregular Students
      </h3>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClassName} pl-9`}
          aria-label="Search irregular students"
        />
      </div>

      <Select
        items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
        value={programFilter}
        onValueChange={(v) => setProgramFilter(v as string)}
      >
        <SelectTrigger aria-label="Filter by program">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ul className="scrollbar-thin flex max-h-105 flex-1 flex-col gap-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-2 py-6 text-center font-body text-sm text-slate-400 dark:text-slate-500">
            {students.length ? "No students match your filter." : "No irregular students found."}
          </li>
        ) : (
          pagination.pageItems.map((student) => {
            const isSelected = student.studentProfileId === selectedStudentProfileId;
            return (
              <li key={student.studentProfileId}>
                <button
                  type="button"
                  onClick={() => onSelect(student)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                    isSelected
                      ? "border-navy-700 bg-navy-700/5 dark:border-gold-400 dark:bg-gold-400/10"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <Radio
                    id={`irregular-student-${student.studentProfileId}`}
                    name="irregular-student"
                    checked={isSelected}
                    readOnly
                  />
                  <span className="flex flex-col">
                    <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                      {student.studentName}
                    </span>
                    <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                      {student.studentId ? `${student.studentId} · ` : ""}
                      {student.programTaken || "—"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <Pagination
        page={pagination.page}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
