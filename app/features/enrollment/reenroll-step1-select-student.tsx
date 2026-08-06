import { useMemo, useState } from "react";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Radio } from "~/components/ui/radio";
import { Spinner } from "~/components/ui/spinner";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";

export type ReenrollDirectoryRow = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
};

type ReenrollStep1SelectStudentProps = {
  directory: ReenrollDirectoryRow[] | null;
  selected: ReenrollDirectoryRow | null;
  onSelect: (row: ReenrollDirectoryRow) => void;
  onNext: () => void;
  onCancel: () => void;
};

export function ReenrollStep1SelectStudent({
  directory,
  selected,
  onSelect,
  onNext,
  onCancel,
}: ReenrollStep1SelectStudentProps) {
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    if (!directory) return [];
    const query = search.trim().toLowerCase();
    if (!query) return directory.slice(0, 20);
    return directory
      .filter((s) => s.name.toLowerCase().includes(query) || (s.studentId ?? "").toLowerCase().includes(query))
      .slice(0, 20);
  }, [directory, search]);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search by student ID, name, email, or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students"
          className={`${inputClassName} pl-9 pr-4`}
        />
      </div>

      <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
        {directory === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center font-body text-sm text-slate-500 dark:text-slate-400">
            {search ? "No students match your search." : "No student records found."}
          </p>
        ) : (
          results.map((row) => {
            const isSelected = row.studentProfileId === selected?.studentProfileId;
            return (
              <button
                key={row.studentProfileId}
                type="button"
                onClick={() => onSelect(row)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                  isSelected
                    ? "border-navy-700 bg-navy-700/5 dark:border-gold-400 dark:bg-gold-400/10"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Radio id={`reenroll-student-${row.studentProfileId}`} name="reenroll-student" checked={isSelected} readOnly />
                <span className="flex flex-col">
                  <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">{row.name}</span>
                  <span className="font-body text-xs text-slate-500 dark:text-slate-400">{row.studentId ?? "No ID"}</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        primaryLabel="Next: Enrollment Information"
        onPrimary={onNext}
        primaryDisabled={!selected}
      />
    </div>
  );
}
