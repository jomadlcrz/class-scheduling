import { useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { DepartmentInstructor } from "~/services/dean.service";
import type { DepartmentSubjectProgram } from "~/types/faculty-load";

type DeanSubjectAssignmentFormProps = {
  open: boolean;
  onClose: () => void;
  instructors: DepartmentInstructor[];
  programs: DepartmentSubjectProgram[];
  onSubmit: (instructorLoads: InstructorLoadPayload[]) => Promise<void>;
  mutating: boolean;
};

type ProgramSelection = {
  programAbbrev: string;
  subjectCodes: string[];
};

type InstructorLoadPayload = {
  firstName: string;
  lastName: string;
  maxWeeklyHours: number;
  programs: { programAbbrev: string; subjects: { subjectCode: string; descriptiveTitle: string }[] }[];
};

export function DeanSubjectAssignmentForm({
  open,
  onClose,
  instructors,
  programs,
  onSubmit,
  mutating,
}: DeanSubjectAssignmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [instructorKey, setInstructorKey] = useState("");
  const [maxWeeklyHours, setMaxWeeklyHours] = useState("21");
  const [programSelections, setProgramSelections] = useState<ProgramSelection[]>([
    { programAbbrev: "", subjectCodes: [] },
  ]);

  function reset() {
    setError(null);
    setInstructorKey("");
    setMaxWeeklyHours("21");
    setProgramSelections([{ programAbbrev: "", subjectCodes: [] }]);
  }

  function handleClose() {
    if (mutating) return;
    reset();
    onClose();
  }

  function handleInstructorChange(value: string | null) {
    if (value !== null) setInstructorKey(value);
  }

  function handleProgramChange(index: number, programAbbrev: string | null) {
    if (programAbbrev === null) return;
    setProgramSelections((prev) =>
      prev.map((sel, i) => (i === index ? { programAbbrev, subjectCodes: [] } : sel)),
    );
  }

  function handleSubjectToggle(programIndex: number, subjectCode: string) {
    setProgramSelections((prev) =>
      prev.map((sel, i) => {
        if (i !== programIndex) return sel;
        const has = sel.subjectCodes.includes(subjectCode);
        return {
          ...sel,
          subjectCodes: has
            ? sel.subjectCodes.filter((c) => c !== subjectCode)
            : [...sel.subjectCodes, subjectCode],
        };
      }),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const instructor = instructors.find(
      (i) => `${i.firstName}|${i.lastName}` === instructorKey,
    );
    if (!instructor) {
      setError("Select an instructor.");
      return;
    }

    const hours = parseFloat(maxWeeklyHours);
    if (isNaN(hours) || hours <= 0) {
      setError("Enter valid max weekly hours.");
      return;
    }

    const validPrograms = programSelections
      .filter((sel) => sel.programAbbrev && sel.subjectCodes.length > 0)
      .map((sel) => {
        const program = programs.find((p) => p.programAbbrev === sel.programAbbrev);
        if (!program) return null;
        const subjects = sel.subjectCodes
          .map((code) => {
            for (const year of program.curriculumDetails) {
              for (const sem of year.semesterDetails) {
                const found = sem.subjects.find((s) => s.subjectCode === code);
                if (found) return { subjectCode: found.subjectCode, descriptiveTitle: found.descriptiveTitle };
              }
            }
            return null;
          })
          .filter(Boolean) as { subjectCode: string; descriptiveTitle: string }[];
        return { programAbbrev: sel.programAbbrev, subjects };
      })
      .filter(Boolean) as InstructorLoadPayload["programs"];

    if (validPrograms.length === 0) {
      setError("Select at least one subject to assign.");
      return;
    }

    onSubmit([
      {
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        maxWeeklyHours: hours,
        programs: validPrograms,
      },
    ]).then(() => {
      reset();
      onClose();
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Assignment failed.");
    });
  }

  const usedProgramAbbrevs = new Set(
    programSelections.filter((s) => s.programAbbrev).map((s) => s.programAbbrev),
  );

  return (
    <Modal open={open} onClose={handleClose} title="Assign Subjects" wide>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          <FormError message={error} />

          {/* Instructor select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-instructor" className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
              Instructor
            </label>
            <Select
              items={instructors.map((i) => ({
                value: `${i.firstName}|${i.lastName}`,
                label: `${i.lastName}, ${i.firstName}`,
              }))}
              value={instructorKey}
              onValueChange={handleInstructorChange}
            >
              <SelectTrigger id="assign-instructor">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={`${i.firstName}|${i.lastName}`} value={`${i.firstName}|${i.lastName}`}>
                    {i.lastName}, {i.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max weekly hours */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-hours" className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
              Max Weekly Hours
            </label>
            <input
              id="assign-hours"
              type="number"
              min={1}
              max={99}
              step={0.5}
              value={maxWeeklyHours}
              onChange={(e) => setMaxWeeklyHours(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-gray-900 outline-none transition-colors focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20"
            />
          </div>

          {/* Program section */}
          <div className="flex flex-col gap-3">
            <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
              Program &amp; Subjects
            </p>

            {programSelections.map((sel, idx) => {
              const availablePrograms = programs.filter(
                (p) => p.programAbbrev === sel.programAbbrev || !usedProgramAbbrevs.has(p.programAbbrev),
              );
              const selectedProgram = programs.find((p) => p.programAbbrev === sel.programAbbrev);
              const allSubjects = selectedProgram
                ? selectedProgram.curriculumDetails.flatMap((y) =>
                    y.semesterDetails.flatMap((s) => s.subjects),
                  )
                : [];

              return (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 p-3 dark:border-white/10"
                >
                    <div className="flex flex-col gap-1.5">
                      <label className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
                        Program
                      </label>
                      <Select
                        items={availablePrograms.map((p) => ({
                          value: p.programAbbrev,
                          label: p.programAbbrev,
                        }))}
                        value={sel.programAbbrev}
                        onValueChange={(v) => handleProgramChange(idx, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrograms.map((p) => (
                            <SelectItem key={p.programAbbrev} value={p.programAbbrev}>
                              {p.programAbbrev}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  {allSubjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {allSubjects.map((sub) => {
                        const checked = sel.subjectCodes.includes(sub.subjectCode);
                        return (
                          <button
                            key={sub.subjectCode}
                            type="button"
                            onClick={() => handleSubjectToggle(idx, sub.subjectCode)}
                            className={`rounded-full border px-2.5 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                              checked
                                ? "border-navy-800 bg-navy-800 text-white dark:border-white dark:bg-white dark:text-navy-900"
                                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                            }`}
                          >
                            {sub.subjectCode}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedProgram && (
                    <p className="mt-2 font-body text-xs text-slate-400 dark:text-slate-500">
                      {sel.subjectCodes.length} selected
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" block={false} onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" block={false} isLoading={mutating} loadingLabel="Saving…">
              Save Assignment
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
