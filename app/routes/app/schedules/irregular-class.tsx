import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { StatCard } from "~/components/ui/stat-card";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { IrregularStudentsSkeleton, TableSkeleton } from "~/components/ui/skeleton";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import { StickyFooter } from "~/components/ui/sticky-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TabButtons } from "~/components/ui/underline-tabs";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import {
  irregularClassService,
  type IrregularStudent,
  type StudentPendingSchedule,
} from "~/services/irregular-class.service";
import type { StudentAssignedSchedule } from "~/services/irregular-class.service";

export function meta() {
  return [
    { title: "Irregular Class — GWC Class Scheduling" },
    { name: "description", content: "Assign irregular students to existing regular class schedules." },
  ];
}

export default function IrregularClassRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <IrregularClassPage />
    </RoleGuard>
  );
}

type Tab = "students" | "assigned";
type Step = 0 | 1 | 2;

const WIZARD_STEPS: StepDefinition[] = [
  { key: "students", label: "Select Students" },
  { key: "schedules", label: "Select Schedules" },
  { key: "review", label: "Review & Assign" },
];

/* ─────────────────── Student Table ─────────────────── */
function StudentTable({
  students,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  students: IrregularStudent[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
}) {
  const pagination = usePagination(students, "students");
  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.studentProfileId));

  return (
    <div>
      <Table>
        <TableHead>
          <TableHeader dense>
            <Checkbox
              id="select-all-students"
              checked={allSelected}
              onChange={() => onSelectAll()}
              ariaLabel="Select all students"
            />
          </TableHeader>
          <TableHeader dense>Student ID</TableHeader>
          <TableHeader dense>Student Name</TableHeader>
          <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
          <TableHeader dense className="hidden md:table-cell">Year Level</TableHeader>
        </TableHead>
        <TableBody>
          {pagination.pageItems.map((student) => {
            const isSelected = selectedIds.has(student.studentProfileId);
            return (
              <TableRow key={student.studentProfileId} className="cursor-pointer" onClick={() => onToggle(student.studentProfileId)}>
                <TableCell dense>
                  <span className="flex shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox id={`irreg-cb-${student.studentProfileId}`} checked={isSelected} onChange={() => onToggle(student.studentProfileId)} />
                  </span>
                </TableCell>
                <TableCell dense className="text-xs text-slate-600 dark:text-slate-300">{student.studentId ?? "—"}</TableCell>
                <TableCell dense className="text-xs font-medium text-navy-700 dark:text-mist-100">{student.studentName}</TableCell>
                <TableCell dense className="hidden text-xs text-slate-600 sm:table-cell dark:text-slate-300">{student.programTaken || "—"}</TableCell>
                <TableCell dense className="hidden text-xs text-slate-600 md:table-cell dark:text-slate-300">{student.yearLevel ? `${yearOrdinal(student.yearLevel)} Year` : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination page={pagination.page} totalItems={pagination.totalItems} pageSize={pagination.pageSize} onPageChange={pagination.setPage} />
    </div>
  );
}

function yearOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/* ─────────────────── Schedule Card ─────────────────── */
type FlatOffering = {
  key: string;
  subjectId: number;
  subjectCode: string;
  set: string | null;
  setId: number;
  regularSchedIds: number[];
  meetingCount: number;
  days: string;
  instructors: string[];
  recommended: boolean;
  recNum?: number;
  recTotal?: number;
};

function ScheduleCardGrid({
  offerings,
  selectedKeys,
  onToggle,
}: {
  offerings: FlatOffering[];
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {offerings.map((o) => {
        const isSelected = selectedKeys.has(o.key);
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onToggle(o.key)}
            className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-left transition-colors ${
              isSelected
                ? "border-navy-700 bg-navy-50 ring-1 ring-navy-700 dark:border-gold-400 dark:bg-gold-400/10 dark:ring-gold-400"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`grid size-4 shrink-0 place-items-center rounded border ${
                  isSelected
                    ? "border-navy-700 bg-navy-700 text-mist-100 dark:border-gold-400 dark:bg-gold-400"
                    : "border-slate-300 bg-white dark:border-white/20 dark:bg-transparent"
                }`}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </span>
                <span className="truncate font-body text-sm font-semibold text-navy-800 dark:text-mist-100">{o.set ?? "—"}</span>
              </div>
              {o.recommended && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-body text-[0.6rem] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Recommended</span>}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">{o.subjectCode}</span>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">{o.days}{o.meetingCount > 1 ? ` · ${o.meetingCount} meetings` : ""}</span>
              <span className="font-body text-xs text-slate-400 dark:text-slate-500">{o.instructors.join(", ") || "TBA"}</span>
            </div>
            {o.recNum !== undefined && o.recNum > 0 && o.recTotal && (
              <span className="font-body text-[0.65rem] text-slate-400 dark:text-slate-500">{o.recNum}/{o.recTotal} students</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */
function IrregularClassPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [selectedOfferingKeys, setSelectedOfferingKeys] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; errors: string[] } | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters } = useSemesters();
  const [schoolYear, setSchoolYear] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");

  const matchedSy = schoolYears.find((sy) => sy.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => String(s.semesterNumber) === semesterNumber);
  const termReady = Boolean(matchedSy && matchedSem);

  const termSuffix = `${matchedSy?.id ?? "none"}:${matchedSem?.semesterNumber ?? "none"}`;
  const { data: students, reload: reloadStudents } = useCachedData(
    `irregular-pending-students:${termSuffix}`,
    () => irregularClassService.listPendingStudents(matchedSy!.id, matchedSem!.semesterNumber),
    { enabled: termReady },
  );
  const { data: pending, reload: reloadPending } = useCachedData(
    `irregular-pending-schedule:${termSuffix}`,
    () => irregularClassService.listPendingSchedule(matchedSy!.id, matchedSem!.semesterNumber),
    { enabled: termReady },
  );
  const { data: assigned, reload: reloadAssigned } = useCachedData(
    `irregular-assigned-schedule:${termSuffix}`,
    () => irregularClassService.listAssignedSchedule(matchedSy!.id, matchedSem!.semesterNumber),
    { enabled: termReady },
  );

  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  useEffect(() => {
    if (semesterNumber || semesters.length === 0) return;
    setSemesterNumber(String(semesters[0].semesterNumber));
  }, [semesterNumber, semesters]);

  const selectedStudents = students
    ? students.filter((s) => selectedStudentIds.has(s.studentProfileId))
    : [];

  const isBulk = selectedStudents.length > 1;
  const activeStudent = selectedStudents[0] ?? null;

  const activePending: StudentPendingSchedule | null | undefined = !termReady
    ? undefined
    : pending?.find((p) => p.studentProfileId === activeStudent?.studentProfileId) ?? null;

  const flatOfferings = useMemo<FlatOffering[]>(() => {
    if (!activePending) return [];
    return activePending.pendingSubjects.flatMap((subj) =>
      subj.availableOfferings.map((o) => ({
        key: `${subj.subjectId}:${o.setId}`,
        subjectId: subj.subjectId,
        subjectCode: subj.subjectCode,
        set: o.set,
        setId: o.setId,
        regularSchedIds: o.regularSchedIds,
        meetingCount: o.meetingCount,
        days: o.days,
        instructors: o.instructors,
        recommended: o.recommended,
      })),
    );
  }, [activePending]);

  const recCounts = useMemo(() => {
    if (!isBulk || !pending || selectedStudents.length === 0) return null;
    const counts = new Map<string, number>();
    const studentIds = new Set(selectedStudents.map((s) => s.studentProfileId));
    for (const p of pending) {
      if (!studentIds.has(p.studentProfileId)) continue;
      for (const subj of p.pendingSubjects) {
        for (const offer of subj.availableOfferings) {
          if (!offer.recommended) continue;
          const key = `${subj.subjectId}:${offer.setId}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [isBulk, pending, selectedStudents]);

  const offeringsWithRecs = useMemo(() => {
    if (!recCounts) return flatOfferings;
    return flatOfferings.map((o) => ({
      ...o,
      recNum: recCounts.get(o.key),
      recTotal: selectedStudents.length,
    }));
  }, [flatOfferings, recCounts, selectedStudents.length]);

  /* ── Search/filter ── */
  const programs = useMemo(
    () => [...new Set((students ?? []).map((s) => s.programTaken).filter(Boolean))].sort(),
    [students],
  );

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (programFilter !== "all" && s.programTaken !== programFilter) return false;
      if (q && !(s.studentId ?? "").toLowerCase().includes(q) && !s.studentName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, studentSearch, programFilter]);

  const recommendedOfferings = offeringsWithRecs.filter((o) => o.recommended);
  const allRecommendedSelected = recommendedOfferings.length > 0 && recommendedOfferings.every((o) => selectedOfferingKeys.has(o.key));

  /* ── Handlers ── */
  function resetWizard() {
    setStep(0);
    setSelectedStudentIds(new Set());
    setSelectedOfferingKeys(new Set());
    setResult(null);
    setStudentSearch("");
    setProgramFilter("all");
  }

  useEffect(() => {
    if (step === 1 && recommendedOfferings.length > 0) {
      setSelectedOfferingKeys(new Set(recommendedOfferings.map((o) => o.key)));
    }
  }, [step]);

  function handleToggleStudent(id: number) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function handleSelectAllStudents() {
    if (!filteredStudents.length) return;
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (filteredStudents.every((s) => next.has(s.studentProfileId))) {
        for (const s of filteredStudents) next.delete(s.studentProfileId);
      } else {
        for (const s of filteredStudents) next.add(s.studentProfileId);
      }
      return next;
    });
  }

  function handleToggleOffering(key: string) {
    setSelectedOfferingKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function handleSelectAllRecommended() {
    if (allRecommendedSelected) {
      setSelectedOfferingKeys(new Set());
    } else {
      setSelectedOfferingKeys(new Set(recommendedOfferings.map((o) => o.key)));
    }
  }

  function getSchedIdsForAssign(): number[] {
    if (!activePending) return [];
    return activePending.pendingSubjects
      .flatMap((subj) => {
        const selectedOffering = subj.availableOfferings.find((o) => selectedOfferingKeys.has(`${subj.subjectId}:${o.setId}`));
        return selectedOffering?.regularSchedIds ?? [];
      })
      .filter((id) => id > 0);
  }

  function canContinueFromStep2(): boolean {
    if (!activePending || activePending.pendingSubjects.length === 0) return false;
    return selectedOfferingKeys.size > 0;
  }

  const selectedSummaryLines = useMemo(() => {
    if (!activePending) return [];
    return activePending.pendingSubjects
      .map((subj) => {
        const key = `${subj.subjectId}:${subj.availableOfferings.find((o) => selectedOfferingKeys.has(`${subj.subjectId}:${o.setId}`))?.setId ?? ""}`;
        const offering = subj.availableOfferings.find((o) => selectedOfferingKeys.has(`${subj.subjectId}:${o.setId}`));
        return offering ? { subjectCode: subj.subjectCode, set: offering.set, key } : null;
      })
      .filter(Boolean) as { subjectCode: string; set: string; key: string }[];
  }, [activePending, selectedOfferingKeys]);

  async function doBulkAssign() {
    if (!matchedSy || !matchedSem || selectedStudents.length === 0) return;
    const schedIds = getSchedIdsForAssign();
    if (schedIds.length === 0) return;
    setBulkAssigning(true);
    let succeeded = 0;
    const errors: string[] = [];
    for (const student of selectedStudents) {
      const p = pending?.find((sp) => sp.studentProfileId === student.studentProfileId);
      if (!p) { errors.push(`${student.studentName}: no pending record.`); continue; }
      try {
        await irregularClassService.assign({
          studentAcademicId: p.studentAcademicId,
          regularSchedIds: schedIds,
          syId: matchedSy.id, semesterNumber: matchedSem.semesterNumber,
        });
        succeeded++;
      } catch (err) {
        errors.push(`${student.studentName}: ${err instanceof Error ? err.message : "Failed"}`);
      }
    }
    setBulkAssigning(false);
    setResult({ succeeded, errors });
    void reloadStudents(); void reloadPending(); void reloadAssigned();
  }

  async function doSingleAssign() {
    if (!matchedSy || !matchedSem || !activePending) return;
    const schedIds = getSchedIdsForAssign();
    if (schedIds.length === 0) return;
    setBulkAssigning(true);
    try {
      await irregularClassService.assign({
        studentAcademicId: activePending.studentAcademicId,
        regularSchedIds: schedIds,
        syId: matchedSy.id, semesterNumber: matchedSem.semesterNumber,
      });
      setResult({ succeeded: 1, errors: [] });
      void reloadStudents(); void reloadPending(); void reloadAssigned();
    } catch (err) {
      setResult({ succeeded: 0, errors: [err instanceof Error ? err.message : "Failed"] });
    } finally {
      setBulkAssigning(false);
    }
  }

  async function handleAssign() {
    if (isBulk) await doBulkAssign();
    else await doSingleAssign();
  }

  /* ── Assigning screen ── */
  if (bulkAssigning) {
    const assigneeNames = isBulk
      ? selectedStudents.slice(0, 3).map((s) => s.studentName)
      : activeStudent
        ? [activeStudent.studentName]
        : [];
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div role="status" aria-label="Assigning students" className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-navy-900/5 dark:border-white/10 dark:bg-surface-raised">
          <div className="flex flex-col items-center px-8 py-10 text-center">
            {/* Loader dots */}
            <div className="flex items-center gap-2 text-gold-400">
              <span className="size-2.5 animate-loader-dot rounded-full bg-gold-400" />
              <span className="size-2.5 animate-loader-dot rounded-full bg-gold-400 [animation-delay:0.15s]" />
              <span className="size-2.5 animate-loader-dot rounded-full bg-gold-400 [animation-delay:0.3s]" />
            </div>

            <p className="mt-6 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
              Assigning {isBulk ? "Students" : "Student"}…
            </p>
            <p className="mt-1 max-w-sm font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Seating into the selected schedules. This only takes a moment — please don't close this window.
            </p>

            {/* Assignee chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {assigneeNames.map((name, i) => (
                <span key={i} className="rounded-full bg-navy-50 px-3 py-1 font-body text-xs text-navy-700 dark:bg-white/10 dark:text-mist-100">{name}</span>
              ))}
              {isBulk && selectedStudents.length > 3 && (
                <span className="rounded-full bg-gold-400/15 px-3 py-1 font-body text-xs font-medium text-gold-600 dark:text-gold-300">+{selectedStudents.length - 3} more</span>
              )}
            </div>

            {/* Schedules being assigned */}
            {selectedSummaryLines.length > 0 && (
              <div className="mt-6 w-full border-t border-slate-100 pt-5 dark:border-white/10">
                <p className="font-body text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Selected Schedules</p>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {selectedSummaryLines.map((line, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      <span className="font-body text-xs text-slate-600 dark:text-slate-300">{line.set ?? "—"}</span>
                      <span className="font-body text-[0.7rem] text-slate-400 dark:text-slate-500">{line.subjectCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Indeterminate progress */}
          <div className="h-0.5 w-full overflow-hidden bg-slate-100 dark:bg-white/5" aria-hidden="true">
            <div className="h-full w-1/3 animate-progress bg-linear-to-r from-transparent via-gold-400 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Result screen ── */
  if (result) {
    const color = result.errors.length === 0 ? "success" as const : "error" as const;
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ResultState tone={color} title={result.errors.length === 0 ? "Assignment Complete" : "Assignment Partially Complete"}>
          <div className="flex flex-col gap-1">
            <span>{result.succeeded} assignment{result.succeeded !== 1 ? "s" : ""} completed successfully.</span>
            {result.errors.length > 0 && (
              <span className="text-red-600 dark:text-red-400">{result.errors.length} could not be assigned.</span>
            )}
          </div>
          {result.errors.length > 0 && (
            <details className="mt-3 text-left">
              <summary className="cursor-pointer font-body text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">View failed assignments</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {result.errors.map((e, i) => <li key={i} className="font-body text-xs text-red-600 dark:text-red-400">{e}</li>)}
              </ul>
            </details>
          )}
        </ResultState>
        <div className="mt-8 flex justify-center">
          <Button type="button" block={false} onClick={resetWizard}>Done</Button>
        </div>
      </div>
    );
  }

  const termSelectors = (
    <div className="grid grid-cols-2 gap-3 sm:max-w-md">
      <Select
        items={schoolYears.map((sy) => ({ value: sy.schoolYear, label: sy.schoolYear }))}
        value={schoolYear}
        onValueChange={(v) => setSchoolYear(v as string)}
      >
        <SelectTrigger id="ic-school-year" aria-label="School Year"><SelectValue /></SelectTrigger>
        <SelectContent>
          {schoolYears.map((sy) => <SelectItem key={sy.id} value={sy.schoolYear}>{sy.schoolYear}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select
        items={semesters.map((s) => ({ value: String(s.semesterNumber), label: s.semester }))}
        value={semesterNumber}
        onValueChange={(v) => setSemesterNumber(v as string)}
      >
        <SelectTrigger id="ic-semester" aria-label="Semester"><SelectValue /></SelectTrigger>
        <SelectContent>
          {semesters.map((s) => <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>{s.semester}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const studentSummary = activeStudent ? (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/8">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Selected Students</p>
      <p className="mt-1 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
        {isBulk ? `${selectedStudents.length} students` : activeStudent.studentName}
      </p>
      {isBulk && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedStudents.slice(0, 5).map((s) => (
            <span key={s.studentProfileId} className="rounded-full bg-navy-50 px-2 py-0.5 font-body text-[0.65rem] text-navy-700 dark:bg-white/10 dark:text-mist-100">{s.studentName}</span>
          ))}
          {selectedStudents.length > 5 && (
            <span className="rounded-full bg-navy-50 px-2 py-0.5 font-body text-[0.65rem] text-navy-700 dark:bg-white/10 dark:text-mist-100">+{selectedStudents.length - 5} more</span>
          )}
        </div>
      )}
      {!isBulk && activeStudent && (
        <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
          {activeStudent.studentId ? `${activeStudent.studentId} · ` : ""}{activeStudent.programTaken || "—"}
        </p>
      )}
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Irregular Schedule Builder" />

      <TabButtons
        ariaLabel="Irregular class"
        className="mt-6"
        value={activeTab}
        onChange={(v) => { setActiveTab(v as Tab); resetWizard(); }}
        tabs={[
          { value: "students", label: "Irregular Students" },
          { value: "assigned", label: "Irregular Schedules" },
        ]}
      />

      {students === null ? (
        activeTab === "students" ? <div className="mt-6"><IrregularStudentsSkeleton /></div> : <div className="mt-6"><TableSkeleton columns={6} rows={8} /></div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {termSelectors}

          {activeTab === "students" ? (
            <Stepper steps={WIZARD_STEPS} currentIndex={step} maxUnlockedIndex={2} onStepClick={(i) => { if (i < step) setStep(i as Step); }} />
          ) : !matchedSy || !matchedSem ? (
            <EmptyState title="Select a term">Pick a school year and semester to see assigned schedules.</EmptyState>
          ) : assigned === null ? (
            <TableSkeleton columns={6} rows={8} />
          ) : assigned.length === 0 ? (
            <EmptyState title="No assigned schedules">No irregular students have an assigned schedule for this term yet.</EmptyState>
          ) : (
            <AssignedScheduleView students={assigned} />
          )}

          {/* ═══ STEP 1 — Select Students ═══ */}
          {activeTab === "students" && step === 0 && (
            !students || students.length === 0 ? (
              <EmptyState title="No irregular students">No students are currently flagged as irregular.</EmptyState>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">Select Students</h2>
                    <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                      {selectedStudentIds.size > 0 ? `${selectedStudentIds.size} selected` : "0 selected"}
                    </span>
                  </div>
                </div>
                {/* Search + Select All */}
                <div className="flex items-center gap-3">
                  <div className="relative w-64 shrink-0 sm:w-72">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><SearchIcon /></span>
                    <input type="search" placeholder="Search..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className={`${inputClassName} pl-9`} aria-label="Search students" />
                  </div>
                  <div className="w-40 shrink-0">
                    <Select
                      items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
                      value={programFilter}
                      onValueChange={(v) => setProgramFilter(v as string)}
                    >
                      <SelectTrigger aria-label="Filter by program"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <button type="button" onClick={handleSelectAllStudents} className="shrink-0 rounded-lg px-3 py-1.5 font-body text-xs text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-mist-100">
                    {filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.studentProfileId)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                {/* Table */}
                <StudentTable students={filteredStudents} selectedIds={selectedStudentIds} onToggle={handleToggleStudent} onSelectAll={handleSelectAllStudents} />
                {/* Footer */}
                {selectedStudentIds.size > 0 && (
                  <StickyFooter>
                    <Button type="button" variant="outline" block={false} onClick={() => navigate("/dashboard")}>Cancel</Button>
                    <Button type="button" block={false} onClick={() => setStep(1)}>Continue</Button>
                  </StickyFooter>
                )}
              </>
            )
          )}

          {/* ═══ STEP 2 — Select Schedules ═══ */}
          {activeTab === "students" && step === 1 && (
            !activePending ? (
              <EmptyState title="No pending schedules">This student has no pending subjects to schedule for this term.</EmptyState>
            ) : (
              <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-6">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">Available Schedules</h2>
                      <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                        {selectedOfferingKeys.size > 0 ? `${selectedOfferingKeys.size} selected` : "0 selected"}
                      </span>
                    </div>
                    <button type="button" onClick={handleSelectAllRecommended} className="rounded-lg px-3 py-1.5 font-body text-xs text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-mist-100">
                      {allRecommendedSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <ScheduleCardGrid offerings={recommendedOfferings} selectedKeys={selectedOfferingKeys} onToggle={handleToggleOffering} />
                  <StickyFooter>
                    <Button type="button" variant="outline" block={false} onClick={() => setStep(0)}>Back</Button>
                    <Button type="button" block={false} disabled={!canContinueFromStep2()} onClick={() => setStep(2)}>Continue</Button>
                  </StickyFooter>
                </div>
                <aside className="hidden lg:block">{studentSummary}</aside>
              </div>
            )
          )}

          {/* ═══ STEP 3 — Review & Assign ═══ */}
          {activeTab === "students" && step === 2 && activePending && (
            <div className="flex flex-col gap-6">
              <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">Assignment Summary</h2>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Students" value={isBulk ? selectedStudents.length : 1} />
                <StatCard label="Schedules" value={selectedOfferingKeys.size} />
                <StatCard
                  label="Assignments"
                  value={(isBulk ? selectedStudents.length : 1) * selectedOfferingKeys.size}
                />
              </div>
              {/* Selected schedules list */}
              <div>
                <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Selected Schedules</h3>
                <div className="mt-2 flex flex-col gap-2">
                  {selectedSummaryLines.length > 0 ? selectedSummaryLines.map((line, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-white/5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">{line.set ?? "—"}</span>
                        <span className="ml-2 font-body text-xs text-slate-500 dark:text-slate-400">{line.subjectCode}</span>
                      </div>
                      <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                        {isBulk ? `${selectedStudents.length} students` : "1 student"}
                      </span>
                    </div>
                  )) : (
                    <p className="font-body text-xs text-slate-400 dark:text-slate-500">No schedules selected.</p>
                  )}
                </div>
              </div>
              <StickyFooter>
                <Button type="button" variant="outline" block={false} onClick={() => setStep(1)}>Back</Button>
                <Button type="button" block={false} isLoading={bulkAssigning} loadingLabel="Assigning…" onClick={handleAssign}>
                  {isBulk ? `Assign to ${selectedStudents.length} Students` : "Assign Student"}
                </Button>
              </StickyFooter>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Assigned tab — unchanged ── */
function AssignedScheduleView({ students }: { students: StudentAssignedSchedule[] }) {
  const [selected, setSelected] = useState<StudentAssignedSchedule | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeader>Student</TableHeader>
          <TableHeader className="hidden sm:table-cell">Student ID</TableHeader>
          <TableHeader>Subjects Enrolled</TableHeader>
        </TableHead>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.studentAcademicId} className="cursor-pointer" onClick={() => setSelected(student)}>
              <TableCell><span className="font-medium text-navy-700 dark:text-mist-100">{student.studentName}</span></TableCell>
              <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">{student.studentId ?? "—"}</TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">{student.assignedSubjects.length} subject{student.assignedSubjects.length !== 1 && "s"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.studentName ?? ""} wide>
        {selected && (
          <div className="flex flex-col gap-4">
            {selected.studentId && <p className="font-body text-sm text-slate-500 dark:text-slate-400">Student ID: {selected.studentId}</p>}
            {selected.assignedSubjects.map((subject) => (
              <div key={subject.subjectId} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">{subject.subjectCode} — {subject.descTitle}</p>
                  <span className="shrink-0 font-body text-xs text-slate-500 dark:text-slate-400">{subject.units} unit{subject.units !== 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableHeader dense>Day</TableHeader>
                      <TableHeader dense>Time</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Room</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Instructor</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Set</TableHeader>
                    </TableHead>
                    <TableBody>
                      {subject.schedules.map((sched) => (
                        <TableRow key={sched.id}>
                          <TableCell dense>{sched.dayOfWeek}</TableCell>
                          <TableCell dense>{sched.startTime} - {sched.endTime}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.room ?? "—"}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.instructor ?? "—"}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.set ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
