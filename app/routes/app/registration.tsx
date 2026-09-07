import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { BottomSheet } from "~/components/ui/bottom-sheet";
import { Button } from "~/components/ui/button";
import { PrinterIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { ScreenHeader } from "~/components/ui/screen-header";
import { SectionHeader } from "~/components/ui/section-header";
import { Skeleton } from "~/components/ui/skeleton";
import { StatCard } from "~/components/ui/stat-card";
import { TermSelector, type EnrolledTermItem } from "~/components/ui/term-selector";
import { Tooltip } from "~/components/ui/tooltip";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useAuth } from "~/hooks/use-auth";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { studentService } from "~/services/student.service";
import type { RegistrationData } from "~/types/registration";

export function meta() {
  return [
    { title: "Certificate of Registration (COR) — GWC Class Scheduling" },
    { name: "description", content: "Official Certificate of Registration for the student." },
  ];
}

function ShareIcon({ size = 14, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CopyIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MailIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function DownloadIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.contain = "strict";
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.fontSize = "12pt";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) return true;
    } catch {
      // Fallback failed
    }
  }

  return false;
}

function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [minWidth]);
  return isDesktop;
}

export default function RegistrationRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <RegistrationPage />
    </RoleGuard>
  );
}

function RegistrationPage() {
  const { user } = useAuth();
  const { yearLevelLabel } = useYearLevels();
  const { context: termContext, selectTerm } = useTermContext();
  const isDesktop = useIsDesktop();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officialCopyModalOpen, setOfficialCopyModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [enrolledTerms, setEnrolledTerms] = useState<EnrolledTermItem[]>([]);

  useEffect(() => {
    studentService
      .getEnrollmentTerms()
      .then((terms) => {
        if (terms && terms.length > 0) {
          setEnrolledTerms(terms);
        }
      })
      .catch(() => {});
  }, []);

  const selectedTerm = termContext?.selection;

  const availableTerms = useMemo<EnrolledTermItem[]>(() => {
    if (enrolledTerms.length > 0) return enrolledTerms;
    if (termContext?.schoolYears && termContext.semesters) {
      const list: EnrolledTermItem[] = [];
      for (const sy of termContext.schoolYears) {
        for (const sem of termContext.semesters) {
          list.push({
            sy_id: sy.id,
            semester_number: sem.semesterNumber,
            school_year: sy.schoolYear,
            semester_name: sem.label,
          });
        }
      }
      return list;
    }
    return [];
  }, [enrolledTerms, termContext]);

  useEffect(() => {
    let mounted = true;
    async function loadCor() {
      setLoading(true);
      setError(null);
      try {
        const data = await studentService.getMyRegistration({
          syId: selectedTerm?.syId ?? undefined,
          semesterNumber: selectedTerm?.semesterNumber ?? undefined,
        });
        if (mounted) {
          setRegistration(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "Failed to load Certificate of Registration.";
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCor();
    return () => {
      mounted = false;
    };
  }, [selectedTerm?.syId, selectedTerm?.semesterNumber]);

  const meta = registration?.meta;
  const summary = registration?.summary;
  const subjects = registration?.subjects ?? [];
  const schedule = registration?.schedule ?? [];

  const rawStudentNo = (meta?.student_id || registration?.student_id)?.trim();
  const studentNo =
    rawStudentNo && rawStudentNo !== "-" && rawStudentNo !== "—"
      ? rawStudentNo
      : "No ID";
  const studentName =
    meta?.full_name ||
    meta?.name_natural ||
    meta?.student_name ||
    registration?.student_name ||
    user?.name ||
    "—";
  const programName =
    meta?.program_name || registration?.program_name || meta?.program_abbrev || "—";
  const programCode = meta?.program_abbrev || registration?.program_code || "";
  const rawYear = meta?.year_level ?? registration?.year_level;
  const rawYearName = meta?.year_level_name;
  const resolvedYearLevel = (() => {
    if (rawYearName && rawYearName.trim() && rawYearName !== "-" && rawYearName !== "—") {
      return rawYearName.trim();
    }
    if (typeof rawYear === "number" && rawYear > 0) {
      return yearLevelLabel(rawYear);
    }
    return "—";
  })();

  const section = meta?.set_name || registration?.section || "";
  const schoolYear = meta?.school_year || registration?.school_year || selectedTerm?.schoolYear || "—";
  const semester = meta?.semester_name || registration?.semester || "—";
  const enrolledStatus = meta?.enrolled_status || registration?.academic_status || "Enrolled";

  const yearAndSection = section && section !== "—" && section !== "-"
    ? section
    : resolvedYearLevel !== "—"
    ? resolvedYearLevel
    : "-";

  const totalUnits =
    summary?.total_units ??
    registration?.total_units ??
    subjects.reduce((acc, s) => acc + (s.units || 0), 0);
  const isIrregular =
    (meta?.enrolled_status || registration?.academic_status || enrolledStatus)?.toLowerCase() === "irregular";

  const shareSubtitle = useMemo(() => {
    const idLabel = studentNo === "No ID" ? "No ID" : `Student no. ${studentNo}`;
    const prog = programCode || (programName !== "—" ? programName : "");

    if (isIrregular) {
      const parts = [idLabel, prog];
      if (yearAndSection && yearAndSection !== "—" && yearAndSection !== "-") {
        parts.push(yearAndSection);
      }
      return parts.filter(Boolean).join(" · ");
    }

    if (yearAndSection && yearAndSection !== "—" && yearAndSection !== "-") {
      return `${idLabel} · ${yearAndSection}`;
    }

    return prog ? `${idLabel} · ${prog}` : idLabel;
  }, [studentNo, isIrregular, programCode, programName, yearAndSection]);

  const registrarName = meta?.registrar_name || "Office of the College Registrar";

  const summaryMessage = useMemo(() => {
    const subjectLines = subjects
      .map((s) => `• ${s.subject_code}: ${s.descriptive_title || s.subject_title} (${s.units} units)`)
      .join("\n");

    return [
      "GOLDEN WEST COLLEGES, INC.",
      "Certificate of Registration (COR)",
      `A.Y. ${schoolYear} · ${semester}`,
      "",
      `Student: ${studentName}`,
      `Student number: ${studentNo}`,
      `Program: ${programCode ? `${programCode} – ` : ""}${programName}`,
      `Section: ${yearAndSection}`,
      `Status: ${enrolledStatus}`,
      `Total units: ${totalUnits}`,
      "",
      "Enrolled subjects:",
      subjectLines,
      "",
      "Certified by: " + registrarName,
    ].join("\n");
  }, [
    subjects,
    schoolYear,
    semester,
    studentName,
    studentNo,
    programCode,
    programName,
    yearAndSection,
    enrolledStatus,
    totalUnits,
    registrarName,
  ]);

  const canSystemShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleSystemShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `COR - ${studentName}`,
          text: summaryMessage,
        });
        setShareModalOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        toast.error("System share could not be completed");
      }
    }
  };

  const handleCopySummary = async () => {
    const copied = await copyTextToClipboard(summaryMessage);
    if (copied) {
      toast.success("COR summary copied to clipboard");
      setShareModalOpen(false);
    } else {
      toast.error("Failed to copy registration details");
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(summaryMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareModalOpen(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`COR - ${studentName} (${schoolYear} · ${semester})`);
    const body = encodeURIComponent(summaryMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShareModalOpen(false);
  };

  const handleDownloadText = () => {
    try {
      const blob = new Blob([summaryMessage], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `COR_${safeName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("COR summary downloaded");
      setShareModalOpen(false);
    } catch {
      toast.error("Failed to download text file");
    }
  };

  return (
    <>
      {/* Mobile Screen Header */}
      <ScreenHeader title="Registration (COR)" className="lg:hidden" />

      {/* =========================================================================
          MOBILE VIEW (< lg) — Dedicated Mobile Experience
          ========================================================================= */}
      <div className="mx-auto w-full px-4 py-4 lg:hidden">
        {/* Term Selector */}
        <div className="mb-4">
          <TermSelector
            terms={availableTerms}
            selectedSyId={selectedTerm?.syId ?? null}
            selectedSemester={selectedTerm?.semesterNumber ?? null}
            onSelectTerm={(syId, semester) => selectTerm(syId, semester)}
          />
        </div>

        {/* 3 States: Loading, Empty / Not enrolled, Content */}
        {loading && !registration ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <EmptyState title="Unable to load registration">{error}</EmptyState>
        ) : !registration || registration.enrolled === false || subjects.length === 0 ? (
          <EmptyState title="Not enrolled this term">
            You are not enrolled in the selected academic term. Please select another term using the selector above.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {/* Institutional Document Header Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-surface-overlay dark:bg-surface">
              <div className="flex items-center gap-3.5">
                <img
                  src="/images/logos/gwc-logo.avif"
                  alt="GWC Seal"
                  className="size-12 object-contain shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-heading text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    GOLDEN WEST COLLEGES
                  </span>
                  <h2 className="font-heading text-lg font-bold tracking-tight text-navy-700 dark:text-mist-100">
                    Certificate of Registration
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    A.Y. {schoolYear} · {semester}
                  </p>
                </div>
              </div>

              {/* Quick Document Actions */}
              <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-3 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:flex-initial"
                >
                  <ShareIcon />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfficialCopyModalOpen(true)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:flex-initial"
                >
                  <PrinterIcon size={14} />
                  <span>Official copy</span>
                </button>
              </div>
            </div>

            {/* Student Profile Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-surface-overlay dark:bg-surface">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-white/5">
                <div>
                  <h3 className="font-heading text-base font-bold text-navy-700 dark:text-mist-100">
                    {studentName}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {studentNo === "No ID" ? "No ID" : `Student no. ${studentNo}`}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-300">
                  {enrolledStatus}
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Program
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {programCode ? `${programCode} – ` : ""}{programName}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Year & section
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {yearAndSection}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrolled Subjects: Mobile Card List (< sm) */}
            <div className="sm:hidden">
              <SectionHeader
                title={`Enrolled Subjects (${subjects.length})`}
                badge={`${totalUnits} total units`}
              />

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs dark:border-surface-overlay dark:bg-surface dark:divide-white/5">
                {subjects.map((sub, idx) => {
                  const title = sub.descriptive_title || sub.subject_title || "—";
                  const lec = sub.lec_hours ?? null;
                  const lab = sub.lab_hours ?? null;
                  const matchSched = schedule.find((s) => s.subject_code === sub.subject_code);
                  const sessionTime = matchSched
                    ? `${matchSched.day.slice(0, 3)} ${matchSched.start_time}–${matchSched.end_time}`
                    : null;
                  const sessionRoom = matchSched?.room;

                  return (
                    <div key={`${sub.subject_code}-${idx}`} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-extrabold text-navy-700 dark:text-mist-100">
                          {sub.subject_code}
                        </span>
                        <div className="flex items-center gap-2">
                          {(lec !== null || lab !== null) && (
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              {lec !== null ? `Lec: ${lec}h` : ""}
                              {lec !== null && lab !== null ? " · " : ""}
                              {lab !== null ? `Lab: ${lab}h` : ""}
                            </span>
                          )}
                          <span className="font-heading text-xs font-bold text-slate-600 dark:text-slate-300">
                            {sub.units} {sub.units === 1 ? "unit" : "units"}
                          </span>
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {title}
                      </p>

                      {(sessionRoom || sessionTime) && (
                        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span>{sessionRoom ? `Room: ${sessionRoom}` : ""}</span>
                          <span>{sessionTime || ""}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Class Schedule: Mobile Card List (< sm) */}
            {schedule.length > 0 && (
              <div className="sm:hidden">
                <SectionHeader
                  title="Class Schedule"
                  badge={`${schedule.length} weekly ${schedule.length === 1 ? "session" : "sessions"}`}
                />

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs dark:border-surface-overlay dark:bg-surface dark:divide-white/5">
                  {schedule.map((entry, idx) => (
                    <div key={`${entry.subject_code}-${entry.day}-${idx}`} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-extrabold text-navy-700 dark:text-mist-100">
                          {entry.day}
                        </span>
                        <span className="font-mono text-xs font-bold text-navy-700 dark:text-mist-100">
                          {entry.start_time} – {entry.end_time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-bold text-navy-700 dark:text-mist-100">
                        <span className="font-extrabold">{entry.subject_code}</span>
                        {entry.descriptive_title ? ` · ${entry.descriptive_title}` : ""}
                      </p>

                      {(entry.room || entry.instructor) && (
                        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span>Room: {entry.room || "TBA"}</span>
                          <span>{entry.instructor || ""}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Subjects: Tablet Table (< lg, >= sm) */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-surface-overlay dark:bg-surface">
              <h3 className="mb-3 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                Enrolled Subjects ({subjects.length})
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-surface-overlay">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Subject code</th>
                      <th className="px-4 py-3">Descriptive title</th>
                      <th className="px-4 py-3 text-center">Units</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {subjects.map((sub, idx) => {
                      const title = sub.descriptive_title || sub.subject_title || "—";
                      const matchSched = schedule.find((s) => s.subject_code === sub.subject_code);
                      const schedStr = matchSched
                        ? `${matchSched.day} ${matchSched.start_time}–${matchSched.end_time}`
                        : "—";

                      return (
                        <tr key={`${sub.subject_code}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                          <td className="px-4 py-3 font-bold text-navy-700 dark:text-mist-100">
                            {sub.subject_code}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {title}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {sub.units}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {schedStr}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {matchSched?.room || "TBA"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50 font-bold dark:border-surface-overlay dark:bg-white/5">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Total enrolled units:
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-extrabold text-navy-700 dark:text-mist-100">
                        {totalUnits}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Official Signatory Footer Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center dark:border-surface-overlay dark:bg-surface-raised">
              <div className="flex items-center justify-center gap-2">
                <span className="rounded bg-gwc-blue px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                  OFFICIAL
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Office of the College Registrar
                </span>
              </div>
              <p className="mt-1 font-heading text-sm font-extrabold text-navy-700 dark:text-mist-100">
                {registrarName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                This is an official digital record verified by the GWC Online Enrollment & Scheduling Portal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= lg screens) — Full Desktop Institutional COR Document
          ========================================================================= */}
      <div className="mx-auto hidden w-full max-w-7xl px-4 py-8 lg:block">
        <PageHeader
          title="Certificate of Registration (COR)"
          actions={
            <div className="flex items-center gap-2.5">
              {availableTerms.length > 0 && (
                <select
                  aria-label="Select Academic Term"
                  value={
                    selectedTerm?.syId && selectedTerm?.semesterNumber
                      ? `${selectedTerm.syId}-${selectedTerm.semesterNumber}`
                      : availableTerms[0]
                        ? `${availableTerms[0].sy_id}-${availableTerms[0].semester_number}`
                        : ""
                  }
                  onChange={(e) => {
                    const [syId, sem] = e.target.value.split("-").map(Number);
                    if (syId && sem) {
                      selectTerm(syId, sem);
                    }
                  }}
                  className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-surface dark:text-slate-200 dark:hover:border-white/20"
                >
                  {availableTerms.map((t) => (
                    <option
                      key={`${t.sy_id}-${t.semester_number}`}
                      value={`${t.sy_id}-${t.semester_number}`}
                    >
                      A.Y. {t.school_year} · {t.semester_name}
                    </option>
                  ))}
                </select>
              )}

              <Tooltip label="Share COR summary">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share COR summary"
                  className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-surface dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <ShareIcon />
                  <span>Share</span>
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={() => setOfficialCopyModalOpen(true)}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-surface dark:text-slate-200 dark:hover:bg-white/5"
              >
                <PrinterIcon size={14} />
                <span>Official copy</span>
              </button>
            </div>
          }
        />

        {loading && !registration ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="mt-6">
            <EmptyState title="Unable to load registration">{error}</EmptyState>
          </div>
        ) : !registration || registration.enrolled === false || subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Not enrolled this term">
              You are not enrolled in the selected academic term. Please select another term using the selector above.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Stat Cards Row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total units" value={totalUnits} />
              <StatCard label="Enrolled subjects" value={subjects.length} />
              <StatCard label="Status" value={enrolledStatus} />
              <StatCard label="Year & section" value={yearAndSection} />
            </div>

            {/* Main Institutional Document Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-surface-overlay dark:bg-surface">
              {/* Institutional Header Banner */}
              <div className="border-b border-slate-200 bg-slate-50/50 p-6 dark:border-surface-overlay dark:bg-white/3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="/images/logos/gwc-logo.avif"
                      alt="GWC Seal"
                      className="size-16 object-contain"
                    />
                    <div>
                      <p className="font-heading text-xs font-extrabold tracking-widest text-slate-500 dark:text-slate-400">
                        GOLDEN WEST COLLEGES, INC.
                      </p>
                      <h2 className="font-heading text-xl font-bold tracking-tight text-navy-700 dark:text-mist-100">
                        Official Certificate of Registration
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Academic Year {schoolYear} · {semester}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-300">
                      <span className="size-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                      {enrolledStatus}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      Official student copy
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Metadata Info Grid */}
              <div className="grid grid-cols-2 gap-6 border-b border-slate-200 p-6 sm:grid-cols-4 dark:border-surface-overlay">
                <div>
                  <span className="font-body text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Student number
                  </span>
                  <p className="mt-1 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                    {studentNo}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Student name
                  </span>
                  <p className="mt-1 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                    {studentName}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Degree program
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {programCode ? `${programCode} – ` : ""}{programName}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Year & section
                  </span>
                  <p className="mt-1 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                    {yearAndSection}
                  </p>
                </div>
              </div>

              {/* Enrolled Subjects Table */}
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                    Enrolled Subjects ({subjects.length})
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {totalUnits} total units
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-surface-overlay">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Subject code</th>
                        <th className="px-4 py-3">Descriptive title</th>
                        <th className="px-4 py-3 text-center">Lec</th>
                        <th className="px-4 py-3 text-center">Lab</th>
                        <th className="px-4 py-3 text-center">Units</th>
                        <th className="px-4 py-3">Schedule</th>
                        <th className="px-4 py-3 text-center">Room</th>
                        <th className="px-4 py-3">Instructor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {subjects.map((sub, idx) => {
                        const matchSched = schedule.find((s) => s.subject_code === sub.subject_code);
                        const schedText = matchSched
                          ? `${matchSched.day.slice(0, 3)} ${matchSched.start_time}–${matchSched.end_time}`
                          : "TBA";
                        const roomText = matchSched?.room || "TBA";
                        const instructorText = matchSched?.instructor || "TBA";

                        return (
                          <tr
                            key={`${sub.subject_code}-${idx}`}
                            className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/3"
                          >
                            <td className="px-4 py-3 font-bold text-navy-700 dark:text-mist-100">
                              {sub.subject_code}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                              {sub.descriptive_title || sub.subject_title || "—"}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
                              {sub.lec_hours ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
                              {sub.lab_hours ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-navy-700 dark:text-mist-100">
                              {sub.units}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {schedText}
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {roomText}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {instructorText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50/80 font-bold dark:border-surface-overlay dark:bg-white/5">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Total enrolled units:
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-extrabold text-navy-700 dark:text-mist-100">
                          {totalUnits}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Class Schedule Timetable (Grouped by Day) if available */}
              {schedule.length > 0 && (
                <div className="border-t border-slate-200 p-6 dark:border-surface-overlay">
                  <h3 className="mb-3 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                    Class Meeting Timetable ({schedule.length} {schedule.length === 1 ? "session" : "sessions"})
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-surface-overlay">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Day</th>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Subject code</th>
                          <th className="px-4 py-3">Descriptive title</th>
                          <th className="px-4 py-3 text-center">Room</th>
                          <th className="px-4 py-3">Instructor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {schedule.map((entry, idx) => (
                          <tr
                            key={`${entry.subject_code}-${entry.day}-${idx}`}
                            className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/3"
                          >
                            <td className="px-4 py-3 font-bold text-navy-700 dark:text-mist-100">
                              {entry.day}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-navy-700 dark:text-mist-100">
                              {entry.start_time} – {entry.end_time}
                            </td>
                            <td className="px-4 py-3 font-bold text-navy-700 dark:text-mist-100">
                              {entry.subject_code}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                              {entry.descriptive_title || "—"}
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {entry.room || "TBA"}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {entry.instructor || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Signatory & Certification Footer */}
              <div className="border-t border-slate-200 bg-slate-50/70 p-6 dark:border-surface-overlay dark:bg-white/3">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gwc-blue px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                        OFFICIAL
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Office of the College Registrar
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      This is an official digital Certificate of Registration verified by Golden West Colleges.
                    </p>
                  </div>

                  <div className="text-right sm:min-w-64">
                    <p className="font-body text-xs font-medium text-slate-400 dark:text-slate-500">
                      Certified correct:
                    </p>
                    <p className="mt-1 font-heading text-sm font-bold text-navy-700 dark:text-mist-100">
                      {registrarName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      College registrar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={officialCopyModalOpen}
        onClose={() => setOfficialCopyModalOpen(false)}
        title="Official Printable Copy"
        footer={
          <Button
            type="button"
            block={false}
            className="px-6 py-2"
            onClick={() => setOfficialCopyModalOpen(false)}
          >
            OK
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          To obtain an officially signed and dry-sealed physical or PDF copy of your Certificate of Registration, please visit the Registrar&apos;s Office.
        </p>
      </Modal>

      {/* Share Dialog: Modal on Desktop (>= lg), BottomSheet on Mobile (< lg) */}
      {(() => {
        const shareContent = (
          <div className="space-y-4">
            {/* Summary Preview Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-surface-overlay dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="font-heading text-xs font-bold text-navy-700 dark:text-mist-100">
                  {studentName}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {totalUnits} {totalUnits === 1 ? "unit" : "units"} · {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {shareSubtitle}
              </p>
            </div>

            {/* Share Action Channels */}
            <div className="space-y-2">
              {canSystemShare && (
                <button
                  type="button"
                  onClick={handleSystemShare}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-6 shrink-0 items-center justify-center text-slate-600 transition-colors group-hover:text-navy-700 dark:text-slate-300 dark:group-hover:text-mist-100">
                      <ShareIcon size={20} />
                    </span>
                    <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                      System share
                    </span>
                  </div>
                  <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex size-6 shrink-0 items-center justify-center text-slate-600 transition-colors group-hover:text-navy-700 dark:text-slate-300 dark:group-hover:text-mist-100">
                    <CopyIcon size={20} />
                  </span>
                  <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                    Copy summary
                  </span>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex size-6 shrink-0 items-center justify-center text-slate-600 transition-colors group-hover:text-navy-700 dark:text-slate-300 dark:group-hover:text-mist-100">
                    <WhatsAppIcon size={20} />
                  </span>
                  <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                    Share via WhatsApp
                  </span>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleEmailShare}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex size-6 shrink-0 items-center justify-center text-slate-600 transition-colors group-hover:text-navy-700 dark:text-slate-300 dark:group-hover:text-mist-100">
                    <MailIcon size={20} />
                  </span>
                  <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                    Share via email
                  </span>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleDownloadText}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-surface dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex size-6 shrink-0 items-center justify-center text-slate-600 transition-colors group-hover:text-navy-700 dark:text-slate-300 dark:group-hover:text-mist-100">
                    <DownloadIcon size={20} />
                  </span>
                  <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                    Download text file
                  </span>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
              </button>
            </div>
          </div>
        );

        return isDesktop ? (
          <Modal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title="Share Registration"
          >
            {shareContent}
          </Modal>
        ) : (
          <BottomSheet
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title="Share Registration"
            subtitle={`A.Y. ${schoolYear} · ${semester}`}
          >
            <div className="pt-1 pb-6">
              {shareContent}
            </div>
          </BottomSheet>
        );
      })()}
    </>
  );
}
