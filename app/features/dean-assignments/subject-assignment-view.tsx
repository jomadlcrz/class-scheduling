import { useState } from "react";
import { toast } from "sonner";
import { Accordion } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ConfirmDialog } from "~/components/ui/modal";
import { PlusIcon } from "~/components/ui/icons";
import { SubjectAssignmentToolbar } from "~/features/dean-assignments/subject-assignment-toolbar";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";
import { PageHeader } from "~/layouts/page-header";
import { InstructorCard } from "./instructor-card";
import { AssignmentSummaryFooter } from "./assignment-summary-footer";
import { AddInstructorModal, AddProgramModal, AssignSubjectModal } from "./assignment-modals";

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
  facultyId: string;
  department: string;
  statusBadge: string;
  maxWeeklyHours: number;
  avatarUrl?: string;
  programs: ProgramGroup[];
};

const INITIAL_MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-1",
    name: "Garcia, Maria Cristina",
    facultyId: "2018-0456",
    department: "Computer Studies",
    statusBadge: "Regular",
    maxWeeklyHours: 24,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    programs: [
      {
        id: "prog-1",
        programAbbrev: "BSCS",
        programName: "Bachelor of Science in Computer Science",
        subjects: [
          { subjectCode: "CS 201", descriptiveTitle: "Data Structures and Algorithms", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "CS 204", descriptiveTitle: "Database Management Systems", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "CS 206", descriptiveTitle: "Computer Networks", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "CS 210", descriptiveTitle: "Web Programming", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "CS 214", descriptiveTitle: "Software Engineering", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
        ],
      },
      {
        id: "prog-2",
        programAbbrev: "BSIT",
        programName: "Bachelor of Science in Information Technology",
        subjects: [],
      },
    ],
  },
  {
    id: "inst-2",
    name: "Santos, John Michael",
    facultyId: "2016-0321",
    department: "Information Technology",
    statusBadge: "Regular",
    maxWeeklyHours: 24,
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    programs: [
      {
        id: "prog-3",
        programAbbrev: "BSIT",
        programName: "Bachelor of Science in Information Technology",
        subjects: [
          { subjectCode: "IT 101", descriptiveTitle: "Introduction to Computing", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "IT 202", descriptiveTitle: "Object-Oriented Programming", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "IT 303", descriptiveTitle: "Information Assurance and Security", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "IT 305", descriptiveTitle: "System Integration and Architecture", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "IT 308", descriptiveTitle: "Human Computer Interaction", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "IT 401", descriptiveTitle: "Capstone Project 1", units: 4, lecHours: 4, labHours: 0, weeklyHours: 4 },
          { subjectCode: "IT 402", descriptiveTitle: "Capstone Project 2", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
        ],
      },
    ],
  },
  {
    id: "inst-3",
    name: "Reyes, Daniel Antonio",
    facultyId: "2017-0198",
    department: "Computer Studies",
    statusBadge: "Regular",
    maxWeeklyHours: 24,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    programs: [
      {
        id: "prog-4",
        programAbbrev: "BSCS",
        programName: "Bachelor of Science in Computer Science",
        subjects: [
          { subjectCode: "CS 301", descriptiveTitle: "Automata Theory and Formal Languages", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "CS 305", descriptiveTitle: "Operating Systems", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "CS 310", descriptiveTitle: "Artificial Intelligence", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
          { subjectCode: "CS 312", descriptiveTitle: "Compiler Design", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "CS 401", descriptiveTitle: "CS Thesis 1", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "CS 402", descriptiveTitle: "CS Thesis 2", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
          { subjectCode: "CS 410", descriptiveTitle: "Cloud Computing", units: 4, lecHours: 3, labHours: 1, weeklyHours: 4 },
          { subjectCode: "CS 415", descriptiveTitle: "Cybersecurity Fundamentals", units: 4, lecHours: 3, labHours: 1, weeklyHours: 4 },
        ],
      },
    ],
  },
];

const AVAILABLE_SAMPLE_SUBJECTS: Subject[] = [
  { subjectCode: "CS 101", descriptiveTitle: "Programming Fundamentals", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
  { subjectCode: "CS 102", descriptiveTitle: "Discrete Mathematics", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
  { subjectCode: "IT 205", descriptiveTitle: "Web Systems and Technologies", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
  { subjectCode: "IT 310", descriptiveTitle: "Mobile Applications Development", units: 3, lecHours: 2, labHours: 1, weeklyHours: 3 },
  { subjectCode: "CS 420", descriptiveTitle: "Machine Learning Concepts", units: 3, lecHours: 3, labHours: 0, weeklyHours: 3 },
];

const MOCK_PROGRAMS = [
  { abbrev: "BSCS", name: "Bachelor of Science in Computer Science" },
  { abbrev: "BSIT", name: "Bachelor of Science in Information Technology" },
  { abbrev: "BSIS", name: "Bachelor of Science in Information Systems" },
  { abbrev: "BSEMC", name: "Bachelor of Science in Entertainment and Multimedia Computing" },
];

export function SubjectAssignmentView() {
  const apiData = useDeanSubjectAssignments();

  // Search filter
  const [search, setSearch] = useState("");

  // Instructors list
  const [instructors, setInstructors] = useState<Instructor[]>(INITIAL_MOCK_INSTRUCTORS);

  // Modal targets
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false);
  const [addProgramTarget, setAddProgramTarget] = useState<string | null>(null);
  const [assignSubjectTarget, setAssignSubjectTarget] = useState<{ instructorId: string; programId: string } | null>(null);
  const [removeInstructorTarget, setRemoveInstructorTarget] = useState<Instructor | null>(null);
  const [removeSubjectTarget, setRemoveSubjectTarget] = useState<{
    instructorId: string;
    programId: string;
    subjectCode: string;
  } | null>(null);

  // Handlers
  const handleMaxHoursChange = (instructorId: string, hours: number) => {
    setInstructors((prev) =>
      prev.map((inst) => (inst.id === instructorId ? { ...inst, maxWeeklyHours: Math.max(1, hours) } : inst)),
    );
  };

  const handleAddInstructor = (name: string, facultyId: string) => {
    const newInst: Instructor = {
      id: `inst-${Date.now()}`,
      name,
      facultyId,
      department: "Computer Studies",
      statusBadge: "Regular",
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
        const newProg: ProgramGroup = {
          id: `prog-${Date.now()}`,
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

  const handleAssignSubject = (subjectCode: string) => {
    if (!assignSubjectTarget) return;
    const sample = AVAILABLE_SAMPLE_SUBJECTS.find((s) => s.subjectCode === subjectCode);
    if (!sample) return;

    setInstructors((prev) =>
      prev.map((inst) => {
        if (inst.id !== assignSubjectTarget.instructorId) return inst;
        return {
          ...inst,
          programs: inst.programs.map((prog) => {
            if (prog.id !== assignSubjectTarget.programId) return prog;
            if (prog.subjects.some((s) => s.subjectCode === sample.subjectCode)) {
              toast.error(`Subject ${sample.subjectCode} is already assigned to this program.`);
              return prog;
            }
            return { ...prog, subjects: [...prog.subjects, { ...sample }] };
          }),
        };
      }),
    );
    setAssignSubjectTarget(null);
    toast.success(`Assigned ${sample.subjectCode} to program.`);
  };

  const handleConfirmRemoveSubject = async () => {
    if (!removeSubjectTarget) return;
    const { instructorId, programId, subjectCode } = removeSubjectTarget;
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
    toast.success(`Removed subject ${subjectCode}`);
  };

  const handleConfirmRemoveInstructor = async () => {
    if (!removeInstructorTarget) return;
    setInstructors((prev) => prev.filter((i) => i.id !== removeInstructorTarget.id));
    setRemoveInstructorTarget(null);
    toast.success(`Instructor removed.`);
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
                onAssignSubject={(programId) => setAssignSubjectTarget({ instructorId: inst.id, programId })}
                onRemoveProgram={(programId) =>
                  setInstructors((prev) =>
                    prev.map((i) => (i.id === inst.id ? { ...i, programs: i.programs.filter((p) => p.id !== programId) } : i)),
                  )
                }
                onRemoveSubject={(programId, subjectCode) =>
                  setRemoveSubjectTarget({ instructorId: inst.id, programId, subjectCode })
                }
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
        onSubmit={() => toast.success("Assignments submitted for term schedule generation.")}
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
        programOptions={MOCK_PROGRAMS}
      />

      <AssignSubjectModal
        open={assignSubjectTarget !== null}
        availableSubjects={AVAILABLE_SAMPLE_SUBJECTS}
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
