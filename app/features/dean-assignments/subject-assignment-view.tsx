import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "~/lib/api";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { SubjectAssignmentToolbar } from "~/features/dean-assignments/subject-assignment-toolbar";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";
import { PageHeader } from "~/layouts/page-header";
import { facultyKey, flattenDepartmentSubjects, formatInstructorName } from "~/lib/faculty-load";
import { deanService } from "~/services/dean.service";
import { AddInstructorModal, AddProgramModal, AssignSubjectModal } from "./assignment-modals";
import { AssignmentSummaryFooter } from "./assignment-summary-footer";
import { InstructorCard } from "./instructor-card";

type Subject = {
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  lecHours: number;
  labHours: number;
  weeklyHours: number;
};

type ProgramGroup = {
  id: string;
  programAbbrev: string;
  programName: string;
  subjects: Subject[];
};

type Instructor = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  facultyId: string;
  department: string;
  statusBadge: string;
  maxWeeklyHours: number;
  avatarUrl?: string;
  programs: ProgramGroup[];
};

export function SubjectAssignmentView() {
  const apiData = useDeanSubjectAssignments();
  const [programOptions, setProgramOptions] = useState<{ abbrev: string; name: string }[]>([]);

  useEffect(() => {
    deanService.listDepartmentPrograms().then(setProgramOptions).catch(() => {});
  }, []);

  // Search filter
  const [search, setSearch] = useState("");

  // Instructors list — starts empty, populated from API data
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // Initialize instructors from API data when available
  useEffect(() => {
    if (!apiData.instructors) return;

    const programNames = new Map<string, string>();
    apiData.subjects?.forEach((p) => {
      if (p.programAbbrev) programNames.set(p.programAbbrev, p.programName);
    });

    const entriesByName = new Map(apiData.entries?.map((e) => [e.instructorName, e]) ?? []);

    const mapped: Instructor[] = apiData.instructors.map((inst) => {
      const id = facultyKey(inst.firstName, inst.lastName);
      const entry = entriesByName.get(formatInstructorName(inst));

      const programMap = new Map<string, Subject[]>();
      for (const subj of entry?.subjects ?? []) {
        const abbrev = subj.programAbbrev ?? "";
        if (!abbrev) continue;
        if (!programMap.has(abbrev)) programMap.set(abbrev, []);
        programMap.get(abbrev)!.push({
          subjectCode: subj.subjectCode,
          descriptiveTitle: subj.descriptiveTitle,
          units: subj.units.total,
          lecHours: subj.units.lecHours,
          labHours: subj.units.labHours,
          weeklyHours: subj.units.lecHours + subj.units.labHours,
        });
      }

      const programs: ProgramGroup[] = Array.from(programMap.entries()).map(([abbrev, subjects]) => ({
        id: abbrev,
        programAbbrev: abbrev,
        programName: programNames.get(abbrev) ?? abbrev,
        subjects,
      }));

      return {
        id,
        name: formatInstructorName(inst),
        firstName: inst.firstName,
        lastName: inst.lastName,
        facultyId: "--",
        department: inst.department,
        statusBadge: "Faculty",
        maxWeeklyHours: entry?.maxWeeklyHours ?? 24,
        programs,
      };
    });

    setInstructors((prev) => {
      const apiIds = new Set(mapped.map((i) => i.id));
      const localOnly = prev.filter((i) => !apiIds.has(i.id));
      return [...mapped, ...localOnly];
    });
  }, [apiData.instructors, apiData.entries, apiData.subjects]);

  // Compute available subjects from the department curriculum tree, grouped by program
  const availableSubjectsByProgram = useMemo(() => {
    if (!apiData.subjects) return new Map<string, Subject[]>();
    const choices = flattenDepartmentSubjects(apiData.subjects);
    const map = new Map<string, Subject[]>();
    for (const c of choices) {
      const subjects = map.get(c.programAbbrev) ?? [];
      subjects.push({
        subjectCode: c.subjectCode,
        descriptiveTitle: c.descriptiveTitle,
        units: c.units,
        lecHours: c.units,
        labHours: 0,
        weeklyHours: c.units,
      });
      map.set(c.programAbbrev, subjects);
    }
    return map;
  }, [apiData.subjects]);

  // Modal targets
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false);
  const [addProgramTarget, setAddProgramTarget] = useState<string | null>(null);
  const [assignSubjectTarget, setAssignSubjectTarget] = useState<{
    instructorId: string;
    programId: string;
    assignedCodes: Set<string>;
  } | null>(null);
  const [removeInstructorTarget, setRemoveInstructorTarget] = useState<Instructor | null>(null);
  const [removeSubjectTarget, setRemoveSubjectTarget] = useState<{
    instructorId: string;
    programId: string;
    subjectCode: string;
    teachingTermId: number | null;
    assignmentId: number | null;
  } | null>(null);

  // Handlers
  const handleMaxHoursChange = (instructorId: string, hours: number) => {
    setInstructors((prev) =>
      prev.map((inst) => (inst.id === instructorId ? { ...inst, maxWeeklyHours: Math.max(1, hours) } : inst)),
    );
  };

  const handleAddInstructor = (name: string, facultyId: string) => {
    const [last, first] = name.split(",").map((s) => s.trim());
    const newInst: Instructor = {
      id: `local-${Date.now()}`,
      name,
      firstName: first || name,
      lastName: last || "",
      facultyId,
      department: "",
      statusBadge: "Faculty",
      maxWeeklyHours: 24,
      programs: [],
    };
    setInstructors((prev) => [...prev, newInst]);
    toast.success(`Instructor ${name} added.`);
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
            return { ...prog, subjects: [...prog.subjects, ...toAdd] };
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
        // Error is already handled by the hook
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
        // Error is already handled by the hook
        setRemoveInstructorTarget(null);
        return;
      }
    }
    
    // Update local state
    setInstructors((prev) => prev.filter((i) => i.id !== removeInstructorTarget.id));
    setRemoveInstructorTarget(null);
    toast.success(`Instructor removed.`);
  };

  const handleSubmit = async () => {
    const instructorLoads = instructors.map((inst) => ({
      firstName: inst.firstName,
      lastName: inst.lastName,
      maxWeeklyHours: inst.maxWeeklyHours,
      programs: inst.programs.map((prog) => ({
        programAbbrev: prog.programAbbrev,
        subjects: prog.subjects.map((s) => ({
          subjectCode: s.subjectCode,
          descriptiveTitle: s.descriptiveTitle,
        })),
      })),
    }));
    
    try {
      await apiData.createAssignments(instructorLoads);
    } catch (error) {
      // Parse and show validation errors from the backend
      if (error instanceof ApiError && error.details) {
        const errors = error.details as any;
        if (errors?.errors?.instructorLoads) {
          const messages: string[] = [];
          const instructorLoadsErrors = errors.errors.instructorLoads;
          
          Object.entries(instructorLoadsErrors).forEach(([instIdx, instErrors]) => {
            const inst = instructors[Number(instIdx)];
            const instName = inst ? inst.name : `Instructor ${Number(instIdx) + 1}`;
            
            if (instErrors && typeof instErrors === 'object') {
              const instErr = instErrors as any;
              if (instErr.programs) {
                Object.entries(instErr.programs).forEach(([progIdx, progErrors]) => {
                  const prog = inst?.programs[Number(progIdx)];
                  const progName = prog ? prog.programAbbrev : `Program ${Number(progIdx) + 1}`;
                  
                  if (progErrors && typeof progErrors === 'object') {
                    const progErr = progErrors as any;
                    if (progErr.subjects && Array.isArray(progErr.subjects)) {
                      progErr.subjects.forEach((msg: string) => {
                        messages.push(`${instName} → ${progName}: ${msg}`);
                      });
                    }
                  }
                });
              }
            }
          });
          
          if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
          }
        }
      }
      
      // Fallback: show the error message from ApiError
      toast.error(error instanceof Error ? error.message : 'Failed to create assignments');
    }
  };

  // Filter calculation
  const filteredInstructors = instructors.filter(
    (inst) =>
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.facultyId.toLowerCase().includes(search.toLowerCase()) ||
      inst.department.toLowerCase().includes(search.toLowerCase()),
  );

  // Summary statistics
  const totalInstructors = filteredInstructors.length;
  const totalPrograms = new Set(filteredInstructors.flatMap((i) => i.programs.map((p) => p.programAbbrev))).size;
  const totalSubjectsAssigned = filteredInstructors.reduce(
    (sum, inst) => sum + inst.programs.reduce((pSum, prog) => pSum + prog.subjects.length, 0),
    0,
  );
  const totalWeeklyHours = filteredInstructors.reduce(
    (sum, inst) =>
      sum +
      inst.programs.reduce(
        (pSum, prog) => pSum + prog.subjects.reduce((sSum, subj) => sSum + subj.weeklyHours, 0),
        0,
      ),
    0,
  );

  const exceedingInstructors = filteredInstructors.filter((inst) => {
    const assigned = inst.programs.reduce(
      (pSum, prog) => pSum + prog.subjects.reduce((sSum, subj) => sSum + subj.weeklyHours, 0),
      0,
    );
    return assigned > inst.maxWeeklyHours;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <PageHeader
        title="Subject Assignments"
        description="Assign and manage instructors' subject loads for the selected academic term."
      />

      {/* Toolbar */}
      <SubjectAssignmentToolbar
        schoolYears={apiData.schoolYears}
        selectedSchoolYearId={apiData.selectedSchoolYearId}
        onSchoolYearChange={apiData.setSelectedSchoolYearId}
        semesters={apiData.semesters}
        selectedSemesterId={apiData.selectedSemesterId}
        semesterLabel={apiData.semesterLabel}
        onSemesterChange={apiData.setSelectedSemesterId}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Teaching Loads Main Section */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-body text-base font-bold text-navy-900 dark:text-white">
            Instructor Subject Assignments
          </h2>
          <Button type="button" variant="primary" block={false} onClick={() => setAddInstructorModalOpen(true)}>
            <PlusIcon />
            Add Existing Instructor
          </Button>
        </div>

        {filteredInstructors.length === 0 ? (
          <EmptyState title="No assignments found">
            No instructors match your current search criteria.
          </EmptyState>
        ) : (
          <Accordion>
            {filteredInstructors.map((inst, i) => (
              <InstructorCard
                key={inst.id}
                instructor={inst}
                defaultOpen={i === 0}
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
                onRemoveInstructor={() => setRemoveInstructorTarget(inst)}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* Sticky Bottom Summary Bar Component */}
      <AssignmentSummaryFooter
        totalInstructors={totalInstructors}
        totalPrograms={totalPrograms}
        totalSubjectsAssigned={totalSubjectsAssigned}
        totalWeeklyHours={totalWeeklyHours}
        exceedingInstructorsCount={exceedingInstructors.length}
        loading={apiData.mutating}
        onSubmit={handleSubmit}
      />

      {/* Feature Modals */}
      <AddInstructorModal
        open={addInstructorModalOpen}
        onClose={() => setAddInstructorModalOpen(false)}
        onAdd={handleAddInstructor}
      />

      <AddProgramModal
        open={addProgramTarget !== null}
        onClose={() => setAddProgramTarget(null)}
        onAdd={handleAddProgram}
        programOptions={programOptions}
      />

      <AssignSubjectModal
        open={assignSubjectTarget !== null}
        availableSubjects={assignSubjectTarget ? (availableSubjectsByProgram.get(assignSubjectTarget.programId) ?? []) : []}
        assignedSubjectCodes={assignSubjectTarget?.assignedCodes ?? new Set()}
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
    </div>
  );
}
