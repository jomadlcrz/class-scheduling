import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { Accordion } from "~/components/ui/accordion";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { AuditLogIcon, PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { ImageViewer } from "~/components/ui/image-viewer";
import { inputClassName } from "~/components/ui/input";
import { SubjectAssignmentToolbar } from "~/features/subject-assignments/subject-assignment-toolbar";
import { SchedulingLoadPolicyDialog } from "~/features/subject-assignments/scheduling-load-policy-dialog";
import { useSubjectAssignments } from "~/features/subject-assignments/use-subject-assignments";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { facultyKey, formatInstructorName, isMajorSubject } from "~/lib/faculty-load";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import { departmentService } from "~/services/department.service";
import type { HoursAdjustmentRequest } from "~/types/authority-workflow";
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
  subjectType?: string | null;
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

type SubjectAssignmentViewProps = {
  /** Full department heading for the drilled-in registrar view. */
  departmentName?: string;
  /** Abbreviated department label for the breadcrumb's last crumb. */
  departmentAbbrev?: string;
  /** Registrar drill-in — department is chosen in the Colleges overview, so hide the toolbar select. */
  hideDepartmentSelect?: boolean;
};

export function SubjectAssignmentView({
  departmentName,
  departmentAbbrev,
  hideDepartmentSelect = false,
}: SubjectAssignmentViewProps = {}) {
  const { user } = useAuth();
  const isRegistrar = user?.role === "registrar";
  // The registrar manages only MINOR subjects; the dean manages only MAJOR
  // subjects — mirroring the backend's write-time role gate on assignments.
  const managesMajor = !isRegistrar;
  const roleSubjectLabel = isRegistrar ? "Minor" : "Major";
  const shouldShowSubject = useCallback(
    (subjectType: string | null | undefined) =>
      // Unknown type — leave it visible rather than risk hiding an existing assignment.
      subjectType == null || isMajorSubject(subjectType) === managesMajor,
    [managesMajor],
  );
  const [searchParams, setSearchParams] = useSearchParams();

  // For Registrar: list academic departments and manage selected department
  const { data: departmentsData } = useCachedData(
    "academic-departments",
    () => departmentService.listAcademic(),
    { enabled: isRegistrar },
  );
  const departments = departmentsData ?? [];

  const queryDeptId = searchParams.get("department_id") ?? "";
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(() => queryDeptId);

  // Sync default department for registrar once loaded
  useEffect(() => {
    if (!isRegistrar || selectedDepartmentId || departments.length === 0) return;
    const initialDept = departments[0]?.id ? String(departments[0].id) : "";
    if (initialDept) {
      setSelectedDepartmentId(initialDept);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has("department_id")) next.set("department_id", initialDept);
        return next;
      }, { replace: true });
    }
  }, [isRegistrar, departments, selectedDepartmentId, setSearchParams]);

  const departmentId = isRegistrar ? (selectedDepartmentId ? Number(selectedDepartmentId) : null) : null;

  const querySyId = Number(searchParams.get("sy_id"));
  const querySemester = Number(searchParams.get("semester_number"));
  const hasQueryTerm =
    Number.isInteger(querySyId) && querySyId > 0 && (querySemester === 1 || querySemester === 2);
  const initialTerm = hasQueryTerm ? { syId: querySyId, semesterNumber: querySemester } : undefined;

  const apiData = useSubjectAssignments({ departmentId, initialTerm });
  const selectedSyId = Number(apiData.selectedSchoolYearId);
  const selectedSemesterNumber = Number(apiData.selectedSemesterNumber);

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
      subjectType?: string | null;
    }[];
  }[]>([]);

  useEffect(() => {
    deanService
      .listDepartmentPrograms(selectedSemesterNumber || undefined)
      .then(setProgramOptions)
      .catch(() => {});
  }, [selectedSemesterNumber]);

  // Search filter
  const [search, setSearch] = useState("");
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
  // Each role only sees the subject type it manages (dean: major, registrar: minor).
  const subjectTypeByCode = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const program of programOptions) {
      for (const subject of program.subjects) {
        map.set(subject.code, subject.subjectType);
      }
    }
    return map;
  }, [programOptions]);

  const availableSubjectsByProgram = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const program of programOptions) {
      map.set(
        program.abbrev,
        program.subjects
          .filter(
            (subject) =>
              !selectedSemesterNumber || subject.semesterCategory === selectedSemesterNumber,
          )
          .map((subject) => ({
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
            subjectType: subject.subjectType,
          }))
          .filter((s) => shouldShowSubject(s.subjectType)),
      );
    }
    return map;
  }, [programOptions, shouldShowSubject, selectedSemesterNumber]);

  // Compute available instructors (exclude already-added ones)
  const availableInstructors = useMemo(() => {
    if (!apiData.instructors) return [];
    const addedIds = new Set(instructors.map((i) => i.id));
    return apiData.instructors.filter((inst) => !addedIds.has(facultyKey(inst.firstName, inst.lastName)));
  }, [apiData.instructors, instructors]);

  // Reset instructors when term filter or department changes
  useEffect(() => {
    setInstructors([]);
  }, [apiData.selectedSchoolYearId, apiData.selectedSemesterNumber, selectedDepartmentId]);

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
        subjects: p.subjects
          .map((s) => ({
            curriculumDetailId: s.curriculumDetailId,
            subjectCode: s.subjectCode,
            descriptiveTitle: s.descriptiveTitle,
            units: s.units,
            lecHours: s.lecHours,
            labHours: s.labHours,
            weeklyHours: s.lecHours + s.labHours,
            subjectType: subjectTypeByCode.get(s.subjectCode),
          }))
          .filter((s) => shouldShowSubject(s.subjectType)),
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
  }, [apiData.entries, apiData.instructors, programNames, subjectTypeByCode, shouldShowSubject]);

  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false);
  const [addProgramTarget, setAddProgramTarget] = useState<string | null>(null);

  // Compute available programs for "Add Existing Program" (exclude already-assigned ones)
  const availableProgramOptions = useMemo(() => {
    if (!addProgramTarget) {
      return programOptions.map((p) => ({ abbrev: p.abbrev, name: p.name }));
    }
    const instructor = instructors.find((i) => i.id === addProgramTarget);
    if (!instructor) {
      return programOptions.map((p) => ({ abbrev: p.abbrev, name: p.name }));
    }
    const assignedAbbrevs = new Set(instructor.programs.map((p) => p.programAbbrev));
    return programOptions
      .filter((p) => !assignedAbbrevs.has(p.abbrev))
      .map((p) => ({ abbrev: p.abbrev, name: p.name }));
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
      subjects: p.subjects
        .map((s) => ({
          curriculumDetailId: s.curriculumDetailId,
          subjectCode: s.subjectCode,
          descriptiveTitle: s.descriptiveTitle,
          units: s.units,
          lecHours: s.lecHours,
          labHours: s.labHours,
          weeklyHours: s.lecHours + s.labHours,
          subjectType: subjectTypeByCode.get(s.subjectCode),
        }))
        .filter((s) => shouldShowSubject(s.subjectType)),
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
    
    if (teachingTermId && assignmentId) {
      try {
        await apiData.deleteAssignment(teachingTermId, assignmentId);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to remove subject");
        }
        setRemoveSubjectTarget(null);
        return;
      }
    }
    
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
    
    const entry = apiData.entries?.find((e) => e.instructorName === removeInstructorTarget.name);
    
    if (entry?.teachingTermId) {
      try {
        await apiData.deleteTeachingTerm(entry.teachingTermId, true);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to remove instructor");
        }
        return;
      }
    }
    
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
        p.subjects
          .filter((s) => shouldShowSubject(subjectTypeByCode.get(s.subjectCode)))
          .map((s) => `${p.programAbbrev}|${s.subjectCode}`),
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
    [instructors, apiData.entries, subjectTypeByCode, shouldShowSubject],
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

  const handleDepartmentChange = (newDeptId: string) => {
    setSelectedDepartmentId(newDeptId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newDeptId) next.set("department_id", newDeptId);
      else next.delete("department_id");
      return next;
    });
  };

  const handleSchoolYearChange = (value: string) => {
    apiData.setSelectedSchoolYearId(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("sy_id", value);
      else next.delete("sy_id");
      return next;
    }, { replace: true });
  };

  const handleSemesterChange = (value: string) => {
    apiData.setSelectedSemesterNumber(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("semester_number", value);
      else next.delete("semester_number");
      return next;
    }, { replace: true });
  };

  const overviewHref = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("department_id");
    next.delete("department_name");
    next.delete("department_abbrev");
    const qs = next.toString();
    return qs ? `/subject-offering?${qs}` : "/subject-offering";
  }, [searchParams]);

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d.id) === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {hideDepartmentSelect && (
        <Breadcrumb
          className="mb-4"
          items={[
            { label: "Colleges overview", href: overviewHref },
            { label: departmentAbbrev || departmentName || "Department" },
          ]}
        />
      )}
      {/* Page Header */}
      <PageHeader
        title={
          departmentName
            ? `Subject Offering — ${departmentName}`
            : isRegistrar && selectedDepartment
              ? `Subject Offering — ${selectedDepartment.abbrev}`
              : `Subject Offering — ${roleSubjectLabel}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={!selectedSyId || !selectedSemesterNumber}
              onClick={() => setPolicyOpen(true)}
            >
              Load Policy
            </Button>
            <Link
              to="/subject-offering/audit-logs"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 font-body text-sm font-medium text-navy-700 transition-all duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 active:scale-[0.97] active:brightness-95 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Subject Offering Audit Logs"
            >
              <AuditLogIcon />
              <span className="hidden sm:inline">Audit Logs</span>
            </Link>
          </div>
        }
      />

      {/* Toolbar */}
      <SubjectAssignmentToolbar
        departments={!hideDepartmentSelect && isRegistrar ? departments : undefined}
        selectedDepartmentId={selectedDepartmentId}
        onDepartmentChange={!hideDepartmentSelect && isRegistrar ? handleDepartmentChange : undefined}
        schoolYears={apiData.schoolYears}
        selectedSchoolYearId={apiData.selectedSchoolYearId}
        onSchoolYearChange={handleSchoolYearChange}
        semesters={apiData.semesters}
        selectedSemesterNumber={apiData.selectedSemesterNumber}
        semesterLabel={apiData.semesterLabel}
        onSemesterChange={handleSemesterChange}
        search={search}
        onSearchChange={setSearch}
      />

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
            {roleSubjectLabel} Subject Assignments
          </h2>
          <Button
            type="button"
            variant="primary"
            block={false}
            disabled={apiData.instructors === null || apiData.entries === null}
            onClick={() => setAddInstructorModalOpen(true)}
          >
            <PlusIcon />
            <span className="hidden sm:inline">Add Existing Instructor</span>
            <span className="sm:hidden">Add Instructor</span>
          </Button>
        </div>

        {apiData.loadError ? (
          <EmptyState title="Couldn't load instructor assignments">{apiData.loadError}</EmptyState>
        ) : apiData.instructors === null || apiData.entries === null ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : isRegistrar && !selectedDepartmentId ? (
          <EmptyState title="Select a department">
            Choose a department from the filter above to view and manage its instructor subject assignments.
          </EmptyState>
        ) : filteredInstructors.length === 0 ? (
          <EmptyState title="No instructors found">
              {apiData.entries && apiData.entries.length > 0
                ? "No instructors match your current search criteria."
                : (
                  <>
                    No {roleSubjectLabel.toLowerCase()} subjects are assigned to instructors for this
                    term. Click <strong>Add Existing Instructor</strong> to assign one.
                  </>
                )}
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
                    const matchedEntry = apiData.entries?.find((e) => e.instructorName === inst.name);
                    setRemoveSubjectTarget({
                      instructorId: inst.id,
                      programId,
                      subjectCode,
                      teachingTermId: matchedEntry?.teachingTermId ?? null,
                      assignmentId: matchedEntry?.subjectAssignmentIds?.get(subjectCode) ?? null,
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
                    if (entry?.teachingTermId) {
                      window.open(`/teaching-terms/${entry.teachingTermId}`, "_blank");
                    }
                  }}
                  onViewAvatar={() => {
                    if (inst.avatarUrl) {
                      setAvatarViewer({ src: inst.avatarUrl, alt: `${inst.name}'s photo` });
                    }
                  }}
                  onRemoveInstructor={() => setRemoveInstructorTarget(inst)}
                  hoursRole={isRegistrar ? "registrar" : "dean"}
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

      <AssignmentSummaryFooter
        totalInstructors={totalInstructors}
        totalPrograms={totalPrograms}
        totalSubjectsAssigned={totalSubjectsAssigned}
        totalWeeklyHours={totalWeeklyHours}
        exceedingInstructorsCount={exceedingInstructors.length}
      />

      {/* Add Instructor Modal */}
      <AddInstructorModal
        open={addInstructorModalOpen}
        onClose={() => setAddInstructorModalOpen(false)}
        availableInstructors={availableInstructors}
        onAdd={handleAddInstructor}
      />

      {/* Add Program Modal */}
      <AddProgramModal
        open={addProgramTarget !== null}
        onClose={() => setAddProgramTarget(null)}
        programOptions={availableProgramOptions}
        onAdd={handleAddProgram}
      />

      {/* Assign Subject Modal */}
      {assignSubjectTarget && (
        <AssignSubjectModal
          open={true}
          onClose={() => setAssignSubjectTarget(null)}
          availableSubjects={availableSubjectsByProgram.get(assignSubjectTarget.programId) ?? []}
          assignedSubjectCodes={assignSubjectTarget.assignedCodes}
          onAssign={handleAssignSubject}
        />
      )}

      {/* Confirm Remove Subject Dialog */}
      <ConfirmDialog
        open={removeSubjectTarget !== null}
        onClose={() => setRemoveSubjectTarget(null)}
        title="Remove Subject Assignment"
        confirmLabel="Remove"
        loadingLabel="Removing..."
        confirmVariant="danger"
        onConfirm={handleConfirmRemoveSubject}
      >
        {removeSubjectTarget
          ? `Are you sure you want to remove ${removeSubjectTarget.subjectCode} from this instructor?`
          : ""}
      </ConfirmDialog>

      {/* Confirm Remove Instructor Dialog */}
      <ConfirmDialog
        open={removeInstructorTarget !== null}
        onClose={() => setRemoveInstructorTarget(null)}
        title="Remove Instructor"
        confirmLabel="Remove"
        loadingLabel="Removing..."
        confirmVariant="danger"
        onConfirm={handleConfirmRemoveInstructor}
      >
        {removeInstructorTarget
          ? `Are you sure you want to remove ${removeInstructorTarget.name} from this term's subject assignments? All assigned subjects will be removed.`
          : ""}
      </ConfirmDialog>

      {/* Profile Photo Viewer */}
      <ImageViewer
        open={avatarViewer !== null}
        src={avatarViewer?.src ?? ""}
        alt={avatarViewer?.alt ?? ""}
        onClose={() => setAvatarViewer(null)}
      />

      {/* Registrar Hours Adjustment Request Dialog */}
      <Modal
        open={hoursRequestTarget !== null}
        onClose={() => !hoursActionBusy && setHoursRequestTarget(null)}
        title="Request Maximum Weekly Hours Adjustment"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Submit a request to adjust the maximum weekly teaching hours for{" "}
            <strong>{hoursRequestTarget?.name}</strong>. The Dean will review and decide on this request.
          </p>

          <div>
            <label htmlFor="req-hours" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Requested Max Weekly Hours
            </label>
            <input
              id="req-hours"
              type="number"
              min={1}
              max={60}
              value={requestedHours ?? ""}
              onChange={(e) => setRequestedHours(e.target.value ? Number(e.target.value) : null)}
              className={`${inputClassName} mt-1 w-full`}
            />
          </div>

          <div>
            <label htmlFor="req-reason" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="req-reason"
              rows={3}
              placeholder="e.g. Additional general education classes needed this semester."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className={`${inputClassName} mt-1 w-full`}
            />
          </div>

          {hoursActionError && (
            <p className="text-xs text-red-600 dark:text-red-400">{hoursActionError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              isLoading={hoursActionBusy}
              disabled={!requestReason.trim() || requestedHours == null || requestedHours <= 0}
              onClick={submitHoursRequest}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dean Review Hours Adjustment Dialog */}
      <Modal
        open={hoursReviewTarget !== null}
        onClose={() => !hoursActionBusy && setHoursReviewTarget(null)}
        title="Review Hours Adjustment Request"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <p className="font-semibold text-navy-700 dark:text-mist-100">
              {hoursReviewTarget?.instructor.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Requested hours: <strong>{hoursReviewTarget?.requested_hours} hrs/week</strong>
            </p>
            {hoursReviewTarget?.reason && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                &ldquo;{hoursReviewTarget.reason}&rdquo;
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Requested by {hoursReviewTarget?.requested_by.name} ({hoursReviewTarget?.requested_by.role})
            </p>
          </div>

          <div>
            <label htmlFor="decision-msg" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Decision Note / Feedback (optional)
            </label>
            <textarea
              id="decision-msg"
              rows={2}
              placeholder="Add an optional comment for the registrar..."
              value={decisionMessage}
              onChange={(e) => setDecisionMessage(e.target.value)}
              className={`${inputClassName} mt-1 w-full`}
            />
          </div>

          {hoursActionError && (
            <p className="text-xs text-red-600 dark:text-red-400">{hoursActionError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              isLoading={hoursActionBusy}
              onClick={() => decideHoursRequest("rejected")}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              isLoading={hoursActionBusy}
              onClick={() => decideHoursRequest("approved")}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unsaved changes confirmation dialog */}
      <ConfirmDialog
        open={blocker.state === "blocked" || reloadPromptOpen}
        onClose={() => {
          if (blocker.state === "blocked") blocker.reset();
          else setReloadPromptOpen(false);
        }}
        title="Unsaved Changes"
        confirmLabel="Leave without saving"
        loadingLabel="Leaving..."
        confirmVariant="danger"
        onConfirm={async () => {
          if (blocker.state === "blocked") blocker.proceed();
          else confirmReload();
        }}
      >
        You have unsaved changes to instructor assignments. Are you sure you want to leave without saving?
      </ConfirmDialog>
    </div>
  );
}
