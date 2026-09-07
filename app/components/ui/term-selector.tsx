import { useMemo, useState } from "react";
import { BottomSheet } from "~/components/ui/bottom-sheet";
import { CalendarIcon, ChevronRightIcon } from "~/components/ui/icons";

export interface EnrolledTermItem {
  sy_id: number;
  semester_number: number;
  school_year: string;
  semester_name?: string;
  is_current?: boolean;
  set_name?: string;
}

export interface TermSelectorProps {
  terms: EnrolledTermItem[];
  selectedSyId: number | null;
  selectedSemester: number | null;
  onSelectTerm: (syId: number, semesterNumber: number) => void;
  className?: string;
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function TermSelector({
  terms,
  selectedSyId,
  selectedSemester,
  onSelectTerm,
  className = "",
}: TermSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stagedSelection, setStagedSelection] = useState<{
    syId: number;
    semester: number;
  } | null>(null);

  const activeTerm = useMemo(() => {
    return terms.find(
      (t) =>
        Number(t.sy_id) === Number(selectedSyId) &&
        Number(t.semester_number) === Number(selectedSemester)
    );
  }, [terms, selectedSyId, selectedSemester]);

  const displayLabel = useMemo(() => {
    if (activeTerm) {
      return `A.Y. ${activeTerm.school_year} · ${
        activeTerm.semester_name || `Semester ${activeTerm.semester_number}`
      }`;
    }
    if (terms.length > 0) {
      const first = terms[0];
      return `A.Y. ${first.school_year} · ${
        first.semester_name || `Semester ${first.semester_number}`
      }`;
    }
    return "Select Academic Term";
  }, [activeTerm, terms]);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter((t) => {
      const sy = (t.school_year || "").toLowerCase();
      const semName = (t.semester_name || "").toLowerCase();
      const semNum = String(t.semester_number || "");
      const setName = (t.set_name || "").toLowerCase();
      const combined = `a.y. ${sy} ${semName} semester ${semNum} ${setName}`.toLowerCase();
      return combined.includes(q);
    });
  }, [terms, searchQuery]);

  const handleOpen = () => {
    setSearchQuery("");
    const currentSyId =
      selectedSyId ?? activeTerm?.sy_id ?? (terms[0]?.sy_id ?? null);
    const currentSem =
      selectedSemester ??
      activeTerm?.semester_number ??
      (terms[0]?.semester_number ?? null);

    if (currentSyId !== null && currentSem !== null) {
      setStagedSelection({ syId: currentSyId, semester: currentSem });
    } else {
      setStagedSelection(null);
    }
    setModalOpen(true);
  };

  const handleDone = () => {
    if (stagedSelection) {
      onSelectTerm(stagedSelection.syId, stagedSelection.semester);
    }
    setModalOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300/80 bg-white py-2.5 px-3.5 text-left transition-colors hover:border-gwc-blue hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
        aria-label={`Academic Term: ${displayLabel}. Tap to change.`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="text-gwc-blue dark:text-gwc-blue-bright shrink-0">
            <CalendarIcon />
          </span>
          <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-mist-100">
            {displayLabel}
          </span>
        </div>
        <span className="ml-2 text-slate-400 shrink-0">
          <ChevronRightIcon />
        </span>
      </button>

      {/* Term Selector Bottom Sheet */}
      <BottomSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Academic Term"
        subtitle="Choose an academic term to view your classes"
        footer={
          <button
            type="button"
            onClick={handleDone}
            disabled={!stagedSelection}
            className="w-full rounded-xl bg-gwc-blue py-3 px-6 font-heading text-sm font-bold text-white transition-colors hover:bg-gwc-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gwc-blue-bright dark:text-navy-950"
          >
            Done
          </button>
        }
      >
        <div className="space-y-3 pb-2">

          {/* Search Bar */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon className="size-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search academic term or year..."
              className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-gwc-blue focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-mist-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-4.5 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600 dark:bg-white/10 dark:text-slate-300"
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}
          </div>

          {/* Radio Options List */}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1 no-scrollbar">
            {filteredTerms.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No matching terms
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? `No academic terms match "${searchQuery}".`
                    : "No enrolled academic terms found."}
                </p>
              </div>
            ) : (
              filteredTerms.map((t) => {
                const isSelected =
                  stagedSelection !== null &&
                  Number(stagedSelection.syId) === Number(t.sy_id) &&
                  Number(stagedSelection.semester) === Number(t.semester_number);
                const isCurrentTerm = Boolean(t.is_current);

                return (
                  <div
                    key={`${t.sy_id}-${t.semester_number}`}
                    onClick={() =>
                      setStagedSelection({ syId: t.sy_id, semester: t.semester_number })
                    }
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-gwc-blue bg-blue-50/60 dark:border-gwc-blue-bright dark:bg-gwc-blue-deep/30"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/5"
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isSelected
                              ? "text-gwc-blue dark:text-gwc-blue-bright"
                              : "text-navy-700 dark:text-mist-100"
                          }`}
                        >
                          A.Y. {t.school_year}
                        </span>
                        {isCurrentTerm && (
                          <span className="rounded-full bg-gwc-blue px-2 py-0.5 text-[10px] font-bold text-white dark:bg-gwc-blue-bright dark:text-navy-950">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {t.semester_name || `Semester ${t.semester_number}`}
                        {t.set_name ? ` · Section ${t.set_name}` : ""}
                      </p>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className={`ml-3 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-gwc-blue bg-white dark:border-gwc-blue-bright dark:bg-surface"
                          : "border-slate-300 bg-white dark:border-white/20 dark:bg-surface"
                      }`}
                    >
                      {isSelected && (
                        <div className="size-2.5 rounded-full bg-gwc-blue dark:bg-gwc-blue-bright" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
