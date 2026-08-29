import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { Accordion } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { ImageViewer } from "~/components/ui/image-viewer";
import { inputClassName } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { StatCard } from "~/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SubjectAssignmentToolbar } from "~/features/subject-assignments/subject-assignment-toolbar";
import { SchedulingLoadPolicyDialog } from "~/features/subject-assignments/scheduling-load-policy-dialog";
import { useSubjectAssignments } from "~/features/subject-assignments/use-subject-assignments";
import { useAuth } from "~/hooks/use-auth";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { facultyKey, formatInstructorName } from "~/lib/faculty-load";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import type { HoursAdjustmentRequest } from "~/types/authority-workflow";
import type { OfferingCoverage } from "~/types/offering-coverage";
import { AddInstructorModal, AddProgramModal, AssignSubjectModal } from "./assignment-modals";
import { AssignmentSummaryFooter } from "./assignment-summary-footer";
import { AssignmentLoadSummary } from "./assignment-load-summary";
import { InstructorCard } from "./instructor-card";

type Subject = {
  curriculumDetailId?: number;
  subjectId?: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  lecHours: number;
  labHours: number;
  weeklyHours: number;
  yearLevel?: number;
  semesterCategory?: number;
};

type ProgramGroup = {
  id: string;
  programId?: number;
  programAbbrev: string;
  programName: string;
  subjects: Subject[];
  isNew?: boolean;
};

type Instructor = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  instructorProfileId: number;
  facultyId: string;
  department: string;
  maxWeeklyHours: number | null;
  loadClassification: "underload" | "regular" | "overload" | null;
  avatarUrl?: string;
  gender?: string | null;
  programs: ProgramGroup[];
};

type OfferingRow = {
  key: string;
  department: string;
  programAbbrev: string;
  programName: string;
  subjectCode: string;
  descriptiveTitle: string;
  yearLevel: number;
  subjectType: string | null;
  assigned: boolean;
  instructors: string[];
};

function flattenOfferingCoverage(coverage: OfferingCoverage | null): OfferingRow[] {
  return (coverage?.departments ?? []).flatMap((department) =>
    department.programs.flatMap((program) =>
      program.subjects.map((subject) => ({
        key: `${department.department_id}:${subject.curriculum_detail_id}`,
        department: department.department_abbrev,
        programAbbrev: program.program_abbrev,
        programName: program.program_name,
        subjectCode: subject.subject_code,
        descriptiveTitle: subject.descriptive_title,
        yearLevel: subject.year_level,
        subjectType: subject.subject_type,
        assigned: subject.assigned,
        instructors: subject.instructors,
      })),
    ),
  );
}

export function SubjectAssignmentView() {
  const apiData = useSubjectAssignments();
  const navigate = useNavigate();
  const selectedSyId = Number(apiData.selectedSchoolYearId);
  const selectedSemesterNumber = Number(apiData.selectedSemesterNumber);
  const offeringScopeReady = selectedSyId > 0 && selectedSemesterNumber > 0;
  const {
    data: offeringCoverage,
    error: offeringCoverageError,
  } = useCachedData(
    `subject-offering-coverage:${selectedSyId || "none"}:${selectedSemesterNumber || "none"}`,
    () => deanService.getOfferingCoverage(selectedSyId, selectedSemesterNumber),
    { enabled: offeringScopeReady },
  );
  const [programOptions, setProgramOptions] = useState<{
    id: number;
    abbrev: string;
    name: string;
    subjects: {
      id: number;
      curriculumDetailId: number;
      code: string;
      title: string;
      units: number;
      yearLevel: number;
      semesterCategory: number;
    }[];
  }[]>([]);

  useEffect(() => {
    deanService.listDepartmentPrograms().then(setProgramOptions).catch(() => {});
  }, []);

  // Auth context
  const { user } = useAuth();

  // Search filter
  const [search, setSearch] = useState("");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(true);
  const [policyOpen, setPolicyOpen] = useState(false);

  // Instructors list — starts empty, populated from API data
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // Hours Adjustment Requests state (Registrar request / Dean review)
  const [hoursRequests, setHoursRequests] = useState<HoursAdjustmentRequest[]>([]);
  const [hoursRequestTarget, setHoursRequestTarget] = useState<Instructor | null>(null);
  const [hoursReviewTarget, setHoursReviewTarget] = useState<HoursAdjustmentRequest | null>(null);
  const [requestedHours, setRequestedHours] = useState<number | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  const [hoursActionBusy, setHoursActionBusy] = useState(false);
  const [hoursActionError, setHoursActionError] = useState<string | null>(null);

  const reloadHoursRequests = useCallback(async () => {
    if (!selectedSyId || !selectedSemesterNumber) {
      setHoursRequests([]);
      return;
    }
    try {
      const list = await authorityWorkflowService.listHoursAdjustmentRequests({
        syId: selectedSyId,
        semesterNumber: selectedSemesterNumber,
      });
      setHoursRequests(list);
    } catch {
      setHoursRequests([]);
    }
  }, [selectedSyId, selectedSemesterNumber]);

  useEffect(() => {
    void reloadHoursRequests();
  }, [reloadHoursRequests]);

  const latestHoursRequest = (teachingTermId: number | null | undefined) =>
    teachingTermId == null
      ? undefined
      : hoursRequests.find((row) => row.teaching_term_id === teachingTermId);

  const openRegistrarHoursRequest = (inst: Instructor) => {
    setHoursRequestTarget(inst);
    setRequestedHours(inst.maxWeeklyHours === 40 ? 41 : Math.min(60, (inst.maxWeeklyHours ?? 40) + 1));
    setRequestReason("");
    setHoursActionError(null);
  };

  const submitHoursRequest = async () => {
    if (!hoursRequestTarget) return;
    const entry = apiData.entries?.find((e) => e.instructorName === hoursRequestTarget.name);
    if (!entry?.teachingTermId || !requestReason.trim() || requestedHours == null) return;
    setHoursActionBusy(true);
    setHoursActionError(null);
    try {
      const { message, request: created } = await authorityWorkflowService.requestHoursAdjustment(
        entry.teachingTermId,
        requestedHours,
        requestReason.trim(),
      );
      if (message) toast.success(message);
      setHoursRequests((prev) => [created, ...prev.filter((row) => row.id !== created.id)]);
      setHoursRequestTarget(null);
    } catch (error) {
      setHoursActionError(error instanceof Error ? error.message : "Unable to send the request.");
    } finally {
      setHoursActionBusy(false);
    }
  };

  const decideHoursRequest = async (decision: "approved" | "rejected") => {
    if (!hoursReviewTarget) return;
    setHoursActionBusy(true);
    setHoursActionError(null);
    try {
      const { message, request: updated } = await authorityWorkflowService.decideHoursAdjustment(
        hoursReviewTarget.id,
        decision,
        decisionMessage.trim() || undefined,
      );
      if (message) toast.success(message);
      setHoursRequests((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      if (decision === "approved") {
        setInstructors((prev) =>
          prev.map((i) =>
            i.instructorProfileId === updated.instructor.instructor_profile_id
              ? { ...i, maxWeeklyHours: updated.requested_hours }
              : i,
          ),
        );
      }
      setHoursReviewTarget(null);
      setDecisionMessage("");
    } catch (error) {
      setHoursActionError(error instanceof Error ? error.message : "Unable to record decision.");
    } finally {
      setHoursActionBusy(false);
    }
  };

  // Track program names from the subjects data for lookup when adding instructors
  const programNames = useMemo(() => {
    const map = new Map<string, string>();
    apiData.subjects?.forEach((p) => {
      if (p.programAbbrev) map.set(p.programAbbrev, p.programName);
    });
    return map;
  }, [apiData.subjects]);

  // Keep the full curriculum available so the picker can group subjects by
  // year level and semester. The curriculum detail id is used when saving.
  const availableSubjectsByProgram = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const program of programOptions) {
      map.set(program.abbrev, program.subjects.map((subject) => ({
        curriculumDetailId: subject.curriculumDetailId,
        subjectId: subject.id,
        subjectCode: subject.code,
        descriptiveTitle: subject.title,
        units: subject.units,
        lecHours: subject.units,
        labHours: 0,
        weeklyHours: subject.units,
        yearLevel: subject.yearLevel,
        semesterCategory: subject.semesterCategory,
      })));
    }
    return map;
  }, [programOptions]);

  // Compute available instructors (exclude already-added ones)
  const availableInstructors = useMemo(() => {
    if (!apiData.instructors) return [];
    const addedIds = new Set(instructors.map((i) => i.id));
    return apiData.instructors.filter((inst) => !addedIds.has(facultyKey(inst.firstName, inst.lastName)));
  }, [apiData.instructors, instructors]);

  // Reset instructors when term filter changes
  useEffect(() => {
    setInstructors([]);
  }, [apiData.selectedSchoolYearId, apiData.selectedSemesterNumber]);

  // Initialize instructors from existing entries (instructors with teaching terms this term)
  useEffect(() => {
    if (!apiData.entries || !apiData.instructors) return;

    const entriesByName = new Map(apiData.entries.map((e) => [e.instructorName, e]));

    const mapped: Instructor[] = apiData.instructors.flatMap((inst) => {
      const id = facultyKey(inst.firstName, inst.lastName);
      const entry = entriesByName.get(formatInstructorName(inst));
      if (!entry) return [];

      const programs: ProgramGroup[] = (entry.programs ?? []).map((p) => ({
        id: p.programAbbrev,
        programAbbrev: p.programAbbrev,
        programName: p.programName ?? programNames.get(p.programAbbrev) ?? p.programAbbrev,
        subjects: p.subjects.map((s) => ({
          curriculumDetailId: s.curriculumDetailId,
          subjectCode: s.subjectCode,
          descriptiveTitle: s.descriptiveTitle,
          units: s.units,
          lecHours: s.lecHours,
          labHours: s.labHours,
          weeklyHours: s.lecHours + s.labHours,
        })),
      }));

      return {
        id,
        name: formatInstructorName(inst),
        firstName: inst.firstName,
        lastName: inst.lastName,
        instructorProfileId: inst.instructorProfileId,
        facultyId: entry.employeeId ?? "--",
        department: inst.department,
        maxWeeklyHours: entry.maxWeeklyHours,
        loadClassification: entry.loadClassification ?? null,
        avatarUrl: inst.profilePhotoUrl ?? undefined,
        gender: inst.gender,
        programs,
      };
    });

    setInstructors((prev) => {
      const apiIds = new Set(mapped.map((i) => i.id));
      const localOnly = prev.filter((i) => !apiIds.has(i.id));
      return [...mapped, ...localOnly];
    });
  }, [apiData.entries, apiData.instructors, programNames]);

  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false);
  const [addProgramTarget, setAddProgramTarget] = useState<string | null>(null);

  // Compute available programs for "Add Existing Program" (exclude already-assigned ones)
  const availableProgramOptions = useMemo(() => {
    if (!addProgramTarget) return programOptions;
    const instructor = instructors.find((i) => i.id === addProgramTarget);
    if (!instructor) return programOptions;
    const assignedAbbrevs = new Set(instructor.programs.map((p) => p.programAbbrev));
    return programOptions.filter((p) => !assignedAbbrevs.has(p.abbrev));
  }, [addProgramTarget, instructors, programOptions]);

  const [assignSubjectTarget, setAssignSubjectTarget] = useState<{
    instructorId: string;
    programId: string;
    assignedCodes: Set<string>;
  } | null>(null);
  const [removeInstructorTarget, setRemoveInstructorTarget] = useState<Instructor | null>(null);
  const [avatarViewer, setAvatarViewer] = useState<{ src: string; alt: string } | null>(null);
  const [removeSubjectTarget, setRemoveSubjectTarget] = useState<{
    instructorId: string;
    programId: string;
    subjectCode: string;
    teachingTermId: number | null;
    assignmentId: number | null;
  } | null>(null);
  // Handlers
  const handleMaxHoursChange = (instructorId: string, hours: number | null) => {
    setInstructors((prev) =>
      prev.map((inst) => (inst.id === instructorId ? { ...inst, maxWeeklyHours: hours } : inst)),
    );
  };

  const handleAddInstructor = (instructor: DepartmentInstructor) => {
    const id = facultyKey(instructor.firstName, instructor.lastName);
    const entry = apiData.entries?.find((e) => e.instructorName === formatInstructorName(instructor));

    const programs: ProgramGroup[] = (entry?.programs ?? []).map((p) => ({
      id: p.programAbbrev,
      programAbbrev: p.programAbbrev,
      programName: p.programName ?? programNames.get(p.programAbbrev) ?? p.programAbbrev,
      subjects: p.subjects.map((s) => ({
        curriculumDetailId: s.curriculumDetailId,
        subjectCode: s.subjectCode,
        descriptiveTitle: s.descriptiveTitle,
        units: s.units,
        lecHours: s.lecHours,
        labHours: s.labHours,
        weeklyHours: s.lecHours + s.labHours,
      })),
    }));

    const newInst: Instructor = {
      id,
      name: formatInstructorName(instructor),
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      instructorProfileId: instructor.instructorProfileId,
      facultyId: instructor.employeeId ?? "--",
      department: instructor.department,
      maxWeeklyHours: entry?.maxWeeklyHours ?? null,
      loadClassification: entry?.loadClassification ?? null,
      avatarUrl: instructor.profilePhotoUrl ?? undefined,
      gender: instructor.gender,
      programs,
    };
    setInstructors((prev) => [newInst, ...prev]);
    toast.success(`Instructor ${newInst.name} added.`);
  };

  const handleAddProgram = (abbrev: string, name: string) => {
    if (!addProgramTarget) return;
    setInstructors((prev) =>
      prev.map((inst) => {
        if (inst.id !== addProgramTarget) return inst;
        if (inst.programs.some((p) => p.programAbbrev === abbrev)) return inst;
        const newProg: ProgramGroup = {
          id: abbrev,
          programAbbrev: abbrev,
          programName: name,
          subjects: [],
          isNew: true,
        };
        return { ...inst, programs: [...inst.programs, newProg] };
      }),
    );
    setAddProgramTarget(null);
    toast.success(`Program ${abbrev} added.`);
  };

  const handleAssignSubject = (subjectCodes: string[]) => {
    if (!assignSubjectTarget) return;

    const programSubjects = availableSubjectsByProgram.get(assignSubjectTarget.programId) ?? [];

    setInstructors((prev) =>
      prev.map((inst) => {
        if (inst.id !== assignSubjectTarget.instructorId) return inst;
        return {
          ...inst,
          programs: inst.programs.map((prog) => {
            if (prog.id !== assignSubjectTarget.programId) return prog;

            const toAdd = subjectCodes
              .map((code) => programSubjects.find((s) => s.subjectCode === code))
              .filter((s): s is Subject => {
                if (!s) return false;
                if (prog.subjects.some((existing) => existing.subjectCode === s.subjectCode)) {
                  toast.error(`Subject ${s.subjectCode} is already assigned to this program.`);
                  return false;
                }
                return true;
              });

            if (toAdd.length === 0) return prog;
            return { ...prog, subjects: [...toAdd, ...prog.subjects] };
          }),
        };
      }),
    );
    setAssignSubjectTarget(null);
    toast.success(`Assigned ${subjectCodes.length} subject${subjectCodes.length !== 1 ? "s" : ""}.`);
  };

  const handleConfirmRemoveSubject = async () => {
    if (!removeSubjectTarget) return;
    const { instructorId, programId, subjectCode, teachingTermId, assignmentId } = removeSubjectTarget;
    
    // Call backend API if we have the IDs
    if (teachingTermId && assignmentId) {
      try {
        await apiData.deleteAssignment(teachingTermId, assignmentId);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to remove subject');
        }
        setRemoveSubjectTarget(null);
        return;
      }
    }
    
    // Update local state
    setInstructors((prev) =>
      prev.map((inst) => {
        if (inst.id !== instructorId) return inst;
        return {
          ...inst,
          programs: inst.programs.map((prog) => {
            if (prog.id !== programId) return prog;
            return { ...prog, subjects: prog.subjects.filter((s) => s.subjectCode !== subjectCode) };
          }),
        };
      }),
    );
    setRemoveSubjectTarget(null);
    toast.success(`Removed subject ${subjectCode}.`);
  };

  const handleConfirmRemoveInstructor = async () => {
    if (!removeInstructorTarget) return;
    
    // Find the entry for this instructor to get the teachingTermId
    const entry = apiData.entries?.find((e) => e.instructorName === removeInstructorTarget.name);
    
    // Call backend API if we have a teaching term
    if (entry?.teachingTermId) {
      try {
        await apiData.deleteTeachingTerm(entry.teachingTermId, true); // cascade=true to remove all assignments
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to remove instructor');
        }
        return;
      }
    }
    
    // Update local state
    setInstructors((prev) => prev.filter((i) => i.id !== removeInstructorTarget.id));
    setRemoveInstructorTarget(null);
    toast.success(`Instructor removed.`);
  };

  const handleUpdateAssignment = async (instructorId: string) => {
    const inst = instructors.find((i) => i.id === instructorId);
    if (!inst) return;

    const payload = {
      instructorProfileId: inst.instructorProfileId,
      maxWeeklyHours: inst.maxWeeklyHours ?? 0,
      programs: inst.programs.map((prog) => {
        const programOption = programOptions.find((p) => p.abbrev === prog.programAbbrev);
        const programId = programOption?.id ?? 0;
        return {
          programId,
          subjects: prog.subjects.map((s) => {
            const subjectOption = programOption?.subjects.find((subj) => subj.code === s.subjectCode);
            return { subjectId: subjectOption?.id ?? 0 };
          }),
        };
      }),
    };

    try {
      await apiData.createAssignments([payload]);
      const entry = apiData.entries?.find((e) => e.instructorName === inst.name);
      if (entry) {
        apiData.syncEntryFromInstructor(inst.name, inst);
      }
      // Reload the backend-computed load classification after assignment changes.
      await apiData.reloadEntries();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to save assignments.");
      }
    }
  };

  function hasAssignmentChanges(inst: Instructor): boolean {
    const entry = apiData.entries?.find((e) => e.instructorName === inst.name);
    if (!entry) return inst.programs.some((p) => p.subjects.length > 0);

    if (inst.maxWeeklyHours !== entry.maxWeeklyHours) return true;

    const originalKeys = new Set(
      (entry.programs ?? []).flatMap((p) =>
        p.subjects.map((s) => `${p.programAbbrev}|${s.subjectCode}`),
      ),
    );
    const currentKeys = new Set(
      inst.programs.flatMap((p) =>
        p.subjects.map((s) => `${p.programAbbrev}|${s.subjectCode}`),
      ),
    );

    if (originalKeys.size !== currentKeys.size) return true;
    for (const key of currentKeys) {
      if (!originalKeys.has(key)) return true;
    }
    return false;
  }

  const isDirty = useMemo(
    () => instructors.some((inst) => hasAssignmentChanges(inst)),
    [instructors, apiData.entries],
  );

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !apiData.mutating);

  // Filter calculation
  const normalizedSearch = search.trim().toLowerCase();
  const filteredInstructors = instructors.filter(
    (inst) =>
      !normalizedSearch ||
      inst.name.toLowerCase().includes(normalizedSearch) ||
      inst.facultyId.toLowerCase().includes(normalizedSearch) ||
      inst.department.toLowerCase().includes(normalizedSearch) ||
      inst.programs.some(
        (program) =>
          program.programAbbrev.toLowerCase().includes(normalizedSearch) ||
          program.programName.toLowerCase().includes(normalizedSearch) ||
          program.subjects.some(
            (subject) =>
              subject.subjectCode.toLowerCase().includes(normalizedSearch) ||
              subject.descriptiveTitle.toLowerCase().includes(normalizedSearch),
          ),
      ),
  );
  const offeringRows = useMemo(() => flattenOfferingCoverage(offeringCoverage), [offeringCoverage]);
  const filteredOfferingRows = offeringRows.filter((offering) => {
    if (showUnassignedOnly && offering.assigned) return false;
    if (!normalizedSearch) return true;
    return (
      offering.subjectCode.toLowerCase().includes(normalizedSearch) ||
      offering.descriptiveTitle.toLowerCase().includes(normalizedSearch) ||
      offering.programAbbrev.toLowerCase().includes(normalizedSearch) ||
      offering.programName.toLowerCase().includes(normalizedSearch) ||
      offering.department.toLowerCase().includes(normalizedSearch) ||
      offering.instructors.some((instructor) => instructor.toLowerCase().includes(normalizedSearch))
    );
  });
  const totalUnassignedOfferings = offeringRows.filter((offering) => !offering.assigned).length;

  function uniqueAssignedHours(inst: Instructor): number {
    const seen = new Set<string>();
    let total = 0;
    for (const prog of inst.programs) {
      for (const subj of prog.subjects) {
        if (!seen.has(subj.subjectCode)) {
          seen.add(subj.subjectCode);
          total += subj.weeklyHours;
        }
      }
    }
    return total;
  }

  function uniqueSubjectCount(inst: Instructor): number {
    return new Set(inst.programs.flatMap((p) => p.subjects.map((s) => s.subjectCode))).size;
  }

  // Summary statistics
  const totalInstructors = filteredInstructors.length;
  const totalPrograms = new Set(filteredInstructors.flatMap((i) => i.programs.map((p) => p.programAbbrev))).size;
  const totalSubjectsAssigned = filteredInstructors.reduce(
    (sum, inst) => sum + uniqueSubjectCount(inst),
    0,
  );
  const totalWeeklyHours = filteredInstructors.reduce(
    (sum, inst) => sum + uniqueAssignedHours(inst),
    0,
  );

  const exceedingInstructors = filteredInstructors.filter((inst) => {
    if (inst.maxWeeklyHours == null) return false;
    return uniqueAssignedHours(inst) > inst.maxWeeklyHours;
  });
  const loadCounts = filteredInstructors.reduce(
    (counts, instructor) => {
      if (instructor.loadClassification) counts[instructor.loadClassification] += 1;
      return counts;
    },
    { underload: 0, regular: 0, overload: 0 },
  );

  if (apiData.instructors === null || apiData.entries === null || (apiData.entries.length > 0 && instructors.length === 0)) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <PageHeader
          title="Subject Offering"
        />
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Page Header */}
      <PageHeader
        title="Subject Offering"
        actions={<Button type="button" variant="outline" block={false} onClick={() => setPolicyOpen(true)}>Load Policy</Button>}
      />

      {/* Toolbar */}
      <SubjectAssignmentToolbar
        schoolYears={apiData.schoolYears}
        selectedSchoolYearId={apiData.selectedSchoolYearId}
        onSchoolYearChange={apiData.setSelectedSchoolYearId}
        semesters={apiData.semesters}
        selectedSemesterNumber={apiData.selectedSemesterNumber}
        semesterLabel={apiData.semesterLabel}
        onSemesterChange={apiData.setSelectedSemesterNumber}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Offering coverage */}
      <section className="mt-6 space-y-4" aria-labelledby="offering-coverage-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="offering-coverage-heading" className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
              Subject Offerings
            </h2>
            <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
              Curriculum subjects available this term and their current instructor coverage.
            </p>
          </div>
          <Checkbox
            id="subject-offering-unassigned-only"
            label="Show unassigned only"
            checked={showUnassignedOnly}
            onChange={setShowUnassignedOnly}
          />
        </div>

        {offeringCoverageError && offeringCoverage === null ? (
          <EmptyState title="Couldn't load subject offerings">{offeringCoverageError}</EmptyState>
        ) : offeringCoverage === null ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : offeringRows.length === 0 ? (
          <EmptyState title="No subject offerings">
            There are no offerable subjects for the selected academic term.
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Without instructor"
                value={totalUnassignedOfferings}
                hint="Offerings still requiring an assignment"
                valueClassName={totalUnassignedOfferings > 0 ? "text-amber-600 dark:text-gold-300" : "text-emerald-600 dark:text-emerald-400"}
              />
              <StatCard
                label="Total offerings"
                value={offeringRows.length}
                hint="Subjects available in the selected term"
              />
            </div>

            {filteredOfferingRows.length === 0 ? (
              <EmptyState title="No offerings found">
                No subject offerings match the current search and coverage filter.
              </EmptyState>
            ) : (
              <Table>
                <TableHead>
                  <TableHeader>Subject</TableHeader>
                  <TableHeader>Program</TableHeader>
                  <TableHeader className="hidden md:table-cell">Department</TableHeader>
                  <TableHeader className="hidden sm:table-cell">Year</TableHeader>
                  <TableHeader className="hidden lg:table-cell">Type</TableHeader>
                  <TableHeader>Current Instructor</TableHeader>
                  <TableHeader className="text-right">Status</TableHeader>
                </TableHead>
                <TableBody>
                  {filteredOfferingRows.map((offering) => (
                    <TableRow key={offering.key}>
                      <TableCell>
                        <span className="font-semibold text-navy-700 dark:text-mist-100">{offering.subjectCode}</span>
                        <span className="block max-w-sm text-xs text-slate-500 dark:text-slate-400">{offering.descriptiveTitle}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-navy-700 dark:text-mist-100">{offering.programAbbrev}</span>
                        <span className="hidden max-w-48 truncate text-xs text-slate-500 dark:text-slate-400 xl:block">{offering.programName}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{offering.department}</TableCell>
                      <TableCell className="hidden sm:table-cell">Year {offering.yearLevel}</TableCell>
                      <TableCell className="hidden lg:table-cell">{offering.subjectType ?? "—"}</TableCell>
                      <TableCell>
                        {offering.instructors.length > 0 ? offering.instructors.join(", ") : <span className="text-slate-400 dark:text-slate-500">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge tone={offering.assigned ? "emerald" : "gold"}>
                          {offering.assigned ? "Assigned" : "Unassigned"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </section>

      <SchedulingLoadPolicyDialog
        open={policyOpen}
        syId={Number(apiData.selectedSchoolYearId) || null}
        semesterNumber={Number(apiData.selectedSemesterNumber) || null}
        onClose={() => setPolicyOpen(false)}
      />

      <AssignmentLoadSummary
        instructors={totalInstructors}
        underload={loadCounts.underload}
        regular={loadCounts.regular}
        overload={loadCounts.overload}
      />

      {/* Teaching Loads Main Section */}
      <div className="mt-4 sm:mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <h2 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100 sm:text-base">
            Instructor Subject Assignments
          </h2>
          <Button type="button" variant="primary" block={false} onClick={() => setAddInstructorModalOpen(true)}>
            <PlusIcon />
            <span className="hidden sm:inline">Add Existing Instructor</span>
            <span className="sm:hidden">Add Instructor</span>
          </Button>
        </div>

        {apiData.loadError ? (
          <EmptyState title="Couldn't load instructor assignments">{apiData.loadError}</EmptyState>
        ) : filteredInstructors.length === 0 ? (
          <EmptyState title="No instructors found">
            {apiData.entries && apiData.entries.length > 0
              ? "No instructors match your current search criteria."
              : <>No instructors are assigned subjects for this term. Click <strong>Add Existing Instructor</strong> to assign one.</>}
          </EmptyState>
        ) : (
          <Accordion>
            {filteredInstructors.map((inst) => {
              const entry = apiData.entries?.find((e) => e.instructorName === inst.name);
              const hoursRequest = latestHoursRequest(entry?.teachingTermId);
              return (
                <InstructorCard
                  key={inst.id}
                  instructor={inst}
                  hasChanges={hasAssignmentChanges(inst)}
                  onMaxHoursChange={(hours) => handleMaxHoursChange(inst.id, hours)}
                  onAddProgram={() => setAddProgramTarget(inst.id)}
                  onAssignSubject={(programId) => {
                    const prog = inst.programs.find((p) => p.id === programId);
                    setAssignSubjectTarget({
                      instructorId: inst.id,
                      programId,
                      assignedCodes: new Set(prog?.subjects.map((s) => s.subjectCode) ?? []),
                    });
                  }}
                  onRemoveSubject={(programId, subjectCode) => {
                    const entry = apiData.entries?.find((e) => e.instructorName === inst.name);
                    setRemoveSubjectTarget({
                      instructorId: inst.id,
                      programId,
                      subjectCode,
                      teachingTermId: entry?.teachingTermId ?? null,
                      assignmentId: entry?.subjectAssignmentIds?.get(subjectCode) ?? null,
                    });
                  }}
                  onRemoveProgram={(programId) => {
                    setInstructors((prev) =>
                      prev.map((i) =>
                        i.id === inst.id
                          ? { ...i, programs: i.programs.filter((p) => p.id !== programId) }
                          : i,
                      ),
                    );
                  }}
                  onUpdateAssignment={() => handleUpdateAssignment(inst.id)}
                  onViewTeachingTerm={() => {
                    const entry = apiData.entries?.find((e) => e.instructorName === inst.name);
                    if (entry?.teachingTermId) {
                      navigate(`/teaching-terms/${entry.teachingTermId}`);
                    }
                  }}
                  onViewAvatar={inst.avatarUrl ? () => setAvatarViewer({ src: inst.avatarUrl!, alt: `${inst.name} profile photo` }) : undefined}
                  onRemoveInstructor={() => setRemoveInstructorTarget(inst)}
                  hoursRole={user?.role === "registrar" || user?.role === "dean" ? user.role : undefined}
                  teachingTermExists={entry?.teachingTermId != null}
                  hoursAdjustmentRequest={hoursRequest}
                  onRequestHoursAdjustment={() => openRegistrarHoursRequest(inst)}
                  onReviewHoursAdjustment={() => {
                    if (!hoursRequest) return;
                    setHoursReviewTarget(hoursRequest);
                    setDecisionMessage("");
                    setHoursActionError(null);
                  }}
                />
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Sticky Bottom Summary Bar Component */}
      {filteredInstructors.length > 0 && (
        <AssignmentSummaryFooter
          totalInstructors={totalInstructors}
          totalPrograms={totalPrograms}
          totalSubjectsAssigned={totalSubjectsAssigned}
          totalWeeklyHours={totalWeeklyHours}
          exceedingInstructorsCount={exceedingInstructors.length}
        />
      )}

      {/* Feature Modals */}
      <AddInstructorModal
        open={addInstructorModalOpen}
        onClose={() => setAddInstructorModalOpen(false)}
        availableInstructors={availableInstructors}
        onAdd={handleAddInstructor}
      />

      {avatarViewer && (
        <ImageViewer
          open
          src={avatarViewer.src}
          alt={avatarViewer.alt}
          onClose={() => setAvatarViewer(null)}
        />
      )}

      <AddProgramModal
        open={addProgramTarget !== null}
        onClose={() => setAddProgramTarget(null)}
        onAdd={handleAddProgram}
        programOptions={availableProgramOptions}
      />

      <AssignSubjectModal
        open={assignSubjectTarget !== null}
        availableSubjects={assignSubjectTarget ? (availableSubjectsByProgram.get(assignSubjectTarget.programId) ?? []) : []}
        assignedSubjectCodes={assignSubjectTarget?.assignedCodes ?? new Set()}
        instructorName={assignSubjectTarget ? instructors.find((i) => i.id === assignSubjectTarget.instructorId)?.name : undefined}
        onClose={() => setAssignSubjectTarget(null)}
        onAssign={handleAssignSubject}
      />

      {/* Action Dialogs */}
      <ConfirmDialog
        open={removeSubjectTarget !== null}
        onClose={() => setRemoveSubjectTarget(null)}
        title="Remove Subject Assignment"
        confirmLabel="Remove Subject"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleConfirmRemoveSubject}
      >
        <p>
          Are you sure you want to remove subject <strong>{removeSubjectTarget?.subjectCode}</strong> from this program load?
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={removeInstructorTarget !== null}
        onClose={() => setRemoveInstructorTarget(null)}
        title="Remove Instructor"
        confirmLabel="Remove Instructor"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleConfirmRemoveInstructor}
      >
        <p>
          Are you sure you want to remove <strong>{removeInstructorTarget?.name}</strong> from teaching loads?
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved assignments?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved subject assignments. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved assignments?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved subject assignments. Reloading will discard them.
      </ConfirmDialog>

      {/* Request Max Weekly Hours Adjustment (Registrar) */}
      <Modal
        open={hoursRequestTarget !== null}
        onClose={() => !hoursActionBusy && setHoursRequestTarget(null)}
        title="Request Max Weekly Hours Adjustment"
      >
        <div className="space-y-4 font-body text-sm text-slate-600 dark:text-slate-300">
          <p>
            Request the Dean of <strong>{hoursRequestTarget?.department}</strong> to authorize a
            new limit for <strong>{hoursRequestTarget?.name}</strong>. The current limit remains in
            force until approval; approval applies the requested value immediately.
          </p>
          {hoursActionError && <p className="text-sm text-red-600 dark:text-red-400">{hoursActionError}</p>}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Requested Max Weekly Hours *</span>
            <input
              type="number"
              min={0}
              max={60}
              value={requestedHours ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                setRequestedHours(raw === "" ? null : Math.min(60, Math.max(0, Number(raw))));
              }}
              className={inputClassName}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Reason *</span>
            <textarea
              value={requestReason}
              onChange={(event) => setRequestReason(event.target.value)}
              rows={4}
              placeholder="Explain why this instructor's weekly limit must change."
              className={`${inputClassName} resize-y`}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={hoursActionBusy}
              onClick={() => setHoursRequestTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              disabled={!requestReason.trim() || requestedHours == null || requestedHours < 0 || requestedHours > 60}
              isLoading={hoursActionBusy}
              loadingLabel="Sending…"
              onClick={submitHoursRequest}
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Max Weekly Hours Request (Dean) */}
      <Modal
        open={hoursReviewTarget !== null}
        onClose={() => !hoursActionBusy && setHoursReviewTarget(null)}
        title="Review Max Weekly Hours Request"
      >
        <div className="space-y-4 font-body text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p><strong>{hoursReviewTarget?.instructor?.full_name}</strong></p>
            <p className="mt-1">
              Current: {hoursReviewTarget?.term?.current_max_weekly_hours} hrs · Requested:{" "}
              <strong>{hoursReviewTarget?.requested_hours} hrs</strong>
            </p>
            <p className="mt-2 whitespace-pre-wrap">Reason: {hoursReviewTarget?.reason}</p>
          </div>
          {hoursActionError && <p className="text-sm text-red-600 dark:text-red-400">{hoursActionError}</p>}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Decision message (optional)</span>
            <textarea
              value={decisionMessage}
              onChange={(event) => setDecisionMessage(event.target.value)}
              rows={3}
              placeholder="Add guidance for the Registrar."
              className={`${inputClassName} resize-y`}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={hoursActionBusy}
              onClick={() => setHoursReviewTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              block={false}
              disabled={hoursActionBusy}
              onClick={() => void decideHoursRequest("rejected")}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              isLoading={hoursActionBusy}
              loadingLabel="Saving…"
              onClick={() => void decideHoursRequest("approved")}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
