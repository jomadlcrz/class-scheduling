import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PrinterIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { ScreenHeader } from "~/components/ui/screen-header";
import { SectionHeader } from "~/components/ui/section-header";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
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
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officialCopyModalOpen, setOfficialCopyModalOpen] = useState(false);
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

  const totalLecHours = useMemo(
    () => subjects.reduce((acc, s) => acc + (s.lec_hours || 0), 0),
    [subjects]
  );
  const totalLabHours = useMemo(
    () => subjects.reduce((acc, s) => acc + (s.lab_hours || 0), 0),
    [subjects]
  );

  const sortedSchedule = useMemo(() => {
    const dayOrder: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return [...schedule].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });
  }, [schedule]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `COR - ${studentName}`,
          text: summaryMessage,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        toast.error("System share could not be completed");
      }
    } else {
      const copied = await copyTextToClipboard(summaryMessage);
      if (copied) {
        toast.success("COR summary copied to clipboard");
      } else {
        toast.error("Share is not supported on this browser");
      }
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
            <Card className="p-5">
              <div className="flex items-center gap-3.5">
                <img
                  src="/images/logos/gwc-logo.avif"
                  alt="GWC Seal"
                  className="size-12 object-contain shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">
                    GOLDEN WEST COLLEGES, INC.
                  </p>
                  <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    Certificate of Registration
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    A.Y. {schoolYear} · {semester}
                  </p>
                </div>
              </div>

              {/* Quick Document Actions */}
              <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-3 dark:border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={handleShare}
                  className="flex-1 h-9 px-3 text-xs sm:flex-initial"
                >
                  <ShareIcon size={14} />
                  <span>Share</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={() => setOfficialCopyModalOpen(true)}
                  className="flex-1 h-9 px-3 text-xs sm:flex-initial"
                >
                  <PrinterIcon size={14} />
                  <span>Official copy</span>
                </Button>
              </div>
            </Card>

            {/* Student Profile Card */}
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-navy-700 dark:text-mist-100">
                    {studentName}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                    {studentNo === "No ID" ? "No ID" : `Student no. ${studentNo}`}
                  </p>
                </div>
                <Badge tone={isIrregular ? "gold" : "navy"}>
                  {enrolledStatus}
                </Badge>
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
            </Card>

            {/* Enrolled Subjects: Mobile Card List (< sm) */}
            <div className="sm:hidden space-y-3">
              <SectionHeader
                title={`Enrolled Subjects (${subjects.length})`}
                badge={`${totalUnits} total units`}
              />

              <Card className="divide-y divide-slate-100 dark:divide-white/10 overflow-hidden">
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
                        <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                          {sub.subject_code}
                        </span>
                        <div className="flex items-center gap-2">
                          {(lec !== null || lab !== null) && (
                            <span className="text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                              {lec !== null ? `Lec: ${lec}h` : ""}
                              {lec !== null && lab !== null ? " · " : ""}
                              {lab !== null ? `Lab: ${lab}h` : ""}
                            </span>
                          )}
                          <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                            {sub.units} {sub.units === 1 ? "unit" : "units"}
                          </span>
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {title}
                      </p>

                      {(sessionRoom || sessionTime) && (
                        <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          <span>{sessionRoom ? `Room: ${sessionRoom}` : ""}</span>
                          <span>{sessionTime || ""}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            </div>

            {/* Class Schedule: Mobile Card List (< sm) */}
            {schedule.length > 0 && (
              <div className="sm:hidden space-y-3">
                <SectionHeader
                  title="Class Schedule"
                  badge={`${schedule.length} weekly ${schedule.length === 1 ? "session" : "sessions"}`}
                />

                <Card className="divide-y divide-slate-100 dark:divide-white/10 overflow-hidden">
                  {schedule.map((entry, idx) => (
                    <div key={`${entry.subject_code}-${entry.day}-${idx}`} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-navy-700 dark:text-mist-100">
                          {entry.day}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-navy-700 dark:text-mist-100">
                          {entry.start_time} – {entry.end_time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-800 dark:text-slate-300">
                        <span className="font-bold text-navy-700 dark:text-mist-100">{entry.subject_code}</span>
                        {entry.descriptive_title ? ` · ${entry.descriptive_title}` : ""}
                      </p>

                      {(entry.room || entry.instructor) && (
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Room: {entry.room || "TBA"}</span>
                          <span>{entry.instructor || ""}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Enrolled Subjects: Tablet Table (< lg, >= sm) */}
            <div className="hidden sm:block space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                    Enrolled Subjects ({subjects.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official list of registered courses for this semester
                  </p>
                </div>
                <span className="text-xs font-bold text-navy-700 dark:text-mist-100">
                  {totalUnits} Total Units
                </span>
              </div>

              <Table>
                <TableHead>
                  <TableHeader>Subject code</TableHeader>
                  <TableHeader>Descriptive title</TableHeader>
                  <TableHeader className="text-center">Units</TableHeader>
                  <TableHeader>Schedule</TableHeader>
                  <TableHeader className="text-center">Room</TableHeader>
                </TableHead>
                <TableBody>
                  {subjects.map((sub, idx) => {
                    const title = sub.descriptive_title || sub.subject_title || "—";
                    const matchSched = schedule.find((s) => s.subject_code === sub.subject_code);
                    const schedStr = matchSched
                      ? `${matchSched.day} ${matchSched.start_time}–${matchSched.end_time}`
                      : "—";

                    return (
                      <TableRow key={`${sub.subject_code}-${idx}`}>
                        <TableCell className="font-bold text-navy-700 dark:text-mist-100">
                          {sub.subject_code}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {title}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-700 dark:text-slate-300">
                          {sub.units}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {schedStr}
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-500 dark:text-slate-400">
                          {matchSched?.room || "TBA"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-50/80 font-bold dark:bg-white/5">
                    <TableCell colSpan={2} className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Total enrolled units:
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-navy-700 dark:text-mist-100">
                      {totalUnits}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Official Signatory Footer Card */}
            <Card className="p-5 text-center bg-slate-50/70 dark:bg-surface-raised">
              <div className="flex items-center justify-center gap-2">
                <span className="rounded bg-gwc-blue px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                  OFFICIAL
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Office of the College Registrar
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-navy-700 dark:text-mist-100">
                {registrarName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                This is an official digital record verified by the GWC Online Enrollment & Scheduling Portal.
              </p>
            </Card>
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
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={handleShare}
                  className="h-9 px-3 text-xs"
                >
                  <ShareIcon size={14} />
                  <span>Share</span>
                </Button>
              </Tooltip>

              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={() => setOfficialCopyModalOpen(true)}
                className="h-9 px-3 text-xs"
              >
                <PrinterIcon size={14} />
                <span>Official copy</span>
              </Button>
            </div>
          }
        />

        {loading && !registration ? (
          <div className="mt-6 space-y-6">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
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
            {/* Student & Registration Information Card */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/logos/gwc-logo.avif"
                    alt="GWC Seal"
                    className="size-14 shrink-0 object-contain"
                  />
                  <div>
                    <p className="font-display text-xs tracking-widest text-slate-500 uppercase dark:text-slate-400">
                      Golden West Colleges, Inc.
                    </p>
                    <h2 className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
                      Certificate of Registration
                    </h2>
                    <p className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Academic Year {schoolYear} · {semester}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-mist-100">
                    <span
                      className={`size-2 rounded-full ${
                        isIrregular ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    {enrolledStatus}
                  </span>
                  <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Official student copy
                  </p>
                </div>
              </div>

              {/* Student Metadata Info Grid */}
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Student number
                  </span>
                  <p className="mt-1 font-body text-sm font-bold text-navy-700 dark:text-mist-100">
                    {studentNo}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Student name
                  </span>
                  <p className="mt-1 font-body text-sm font-bold text-navy-700 dark:text-mist-100">
                    {studentName}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Degree program
                  </span>
                  <p
                    className="mt-1 truncate font-body text-sm font-bold text-navy-700 dark:text-mist-100"
                    title={`${programCode ? `${programCode} – ` : ""}${programName}`}
                  >
                    {programCode ? `${programCode} – ` : ""}{programName}
                  </p>
                </div>
                <div>
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Year & section
                  </span>
                  <p className="mt-1 font-body text-sm font-bold text-navy-700 dark:text-mist-100">
                    {yearAndSection}
                  </p>
                </div>
              </div>
            </Card>

            {/* Enrolled Subjects Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                    Enrolled Subjects ({subjects.length})
                  </h3>
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                    Official list of registered courses for this semester
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-navy-700 dark:text-mist-100">
                  {totalUnits} Total Units
                </span>
              </div>

              <Table>
                <TableHead>
                  <TableHeader>Subject code</TableHeader>
                  <TableHeader>Descriptive title</TableHeader>
                  <TableHeader className="text-center">Lec</TableHeader>
                  <TableHeader className="text-center">Lab</TableHeader>
                  <TableHeader className="text-center">Units</TableHeader>
                  <TableHeader>Schedule</TableHeader>
                  <TableHeader className="text-center">Room</TableHeader>
                  <TableHeader>Instructor</TableHeader>
                </TableHead>
                <TableBody>
                  {subjects.map((sub, idx) => {
                    const matchSched = schedule.find((s) => s.subject_code === sub.subject_code);
                    const schedText = matchSched
                      ? `${matchSched.day.slice(0, 3)} ${matchSched.start_time}–${matchSched.end_time}`
                      : "TBA";
                    const roomText = matchSched?.room || "TBA";
                    const instructorText = matchSched?.instructor || "TBA";

                    return (
                      <TableRow key={`${sub.subject_code}-${idx}`}>
                        <TableCell className="font-bold text-navy-700 dark:text-mist-100">
                          {sub.subject_code}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {sub.descriptive_title || sub.subject_title || "—"}
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400">
                          {sub.lec_hours ?? "—"}
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400">
                          {sub.lab_hours ?? "—"}
                        </TableCell>
                        <TableCell className="text-center font-bold text-navy-700 dark:text-mist-100">
                          {sub.units}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {schedText}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {roomText}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {instructorText}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-50/80 font-bold dark:bg-white/5">
                    <TableCell colSpan={2} className="text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Totals:
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      {totalLecHours > 0 ? `${totalLecHours}h` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      {totalLabHours > 0 ? `${totalLabHours}h` : "—"}
                    </TableCell>
                    <TableCell className="text-center font-display text-base text-navy-700 dark:text-mist-100">
                      {totalUnits}
                    </TableCell>
                    <TableCell colSpan={3} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Enrolled Units
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Class Schedule Timetable */}
            {sortedSchedule.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                      Class Meeting Timetable ({sortedSchedule.length} {sortedSchedule.length === 1 ? "session" : "sessions"})
                    </h3>
                    <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                      Weekly meeting schedule and room assignments
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHead>
                    <TableHeader>Day</TableHeader>
                    <TableHeader>Time</TableHeader>
                    <TableHeader>Subject code</TableHeader>
                    <TableHeader>Descriptive title</TableHeader>
                    <TableHeader className="text-center">Room</TableHeader>
                    <TableHeader>Instructor</TableHeader>
                  </TableHead>
                  <TableBody>
                    {sortedSchedule.map((entry, idx) => (
                      <TableRow key={`${entry.subject_code}-${entry.day}-${idx}`}>
                        <TableCell className="font-bold text-navy-700 dark:text-mist-100">
                          {entry.day}
                        </TableCell>
                        <TableCell className="font-body text-xs font-bold tabular-nums text-navy-700 dark:text-mist-100">
                          {entry.start_time} – {entry.end_time}
                        </TableCell>
                        <TableCell className="font-bold text-navy-700 dark:text-mist-100">
                          {entry.subject_code}
                        </TableCell>
                        <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                          {entry.descriptive_title || "—"}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {entry.room || "TBA"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {entry.instructor || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Official Signatory & Certification Card */}
            <Card className="p-6">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gwc-blue px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                      OFFICIAL DIGITAL RECORD
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Office of the College Registrar
                    </span>
                  </div>
                  <p className="mt-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
                    This is an official digital Certificate of Registration verified by Golden West Colleges.
                  </p>
                </div>

                <div className="text-right sm:min-w-64">
                  <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Certified correct:
                  </p>
                  <p className="mt-1 font-body text-sm font-bold text-navy-700 dark:text-mist-100">
                    {registrarName}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    College registrar
                  </p>
                </div>
              </div>
            </Card>
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
    </>
  );
}
