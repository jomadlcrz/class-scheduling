import { PrinterIcon } from "~/components/ui/icons";
import { openFacultyLoadingPrint } from "~/features/faculty/print-faculty-loading";
import type { FacultyLoadingEntry } from "~/types/faculty-load";

type FacultyLoadingLetterheadProps = {
  entry: FacultyLoadingEntry | null;
  schoolYearLabel: string;
  semesterName: string;
  showPrint?: boolean;
};

export function FacultyLoadingLetterhead({
  entry,
  schoolYearLabel,
  semesterName,
  showPrint = true,
}: FacultyLoadingLetterheadProps) {
  return (
    <div className="w-full">
      {/* ── Letterhead ── */}
      <div className="relative flex items-center justify-center gap-4 border-b-2 border-navy-800 px-4 py-3 dark:border-navy-400">
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          className="h-16 w-16 shrink-0 rounded-full object-contain"
        />
        <div className="text-center">
          <p className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
            GOLDEN WEST COLLEGES, INC.
          </p>
          <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-200">
            San Jose Drive, Alaminos City, Pangasinan *Tel. No. (075) 552-7382
          </p>
          <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-200">
            Email Address: goldenwest.colleges@yahoo.com.ph
          </p>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="relative flex items-center justify-center py-2">
        <p className="font-display text-lg tracking-widest text-navy-800 dark:text-mist-100">
          FACULTY LOADING
        </p>
        {showPrint && (
          <button
            type="button"
            onClick={() => {
              if (entry) openFacultyLoadingPrint(entry, { schoolYear: schoolYearLabel, semesterLabel: semesterName });
            }}
            disabled={!entry}
            className="no-print absolute right-4 grid size-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-navy-100 hover:text-navy-800 disabled:cursor-default disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Print faculty loading"
            title="Print"
          >
            <PrinterIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
