import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { EnrollStudentInput, StudentAccountRow } from "~/types/student";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

type StudentEnrollFormProps = {
  student: StudentAccountRow;
  programs: Program[];
  sets: ClassSet[];
  subjects: Subject[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  studentTypes: string[];
  academicStatuses: string[];
  onSubmit: (input: EnrollStudentInput) => Promise<void>;
  onCancel: () => void;
};

/** Re-enrolls an existing student into a new school year/semester (POST /students/{id}/enroll). */
export function StudentEnrollForm({
  student,
  programs,
  sets,
  subjects,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  onSubmit,
  onCancel,
}: StudentEnrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { yearLevelIds, yearLevelLabel } = useYearLevels();

  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [setId, setSetId] = useState("");
  const [syId, setSyId] = useState("");
  const [semId, setSemId] = useState("");
  const [studentType, setStudentType] = useState("");
  const [enrolledStatus, setEnrolledStatus] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());

  const selectedProgram = programs.find((p) => String(p.id) === programId);
  const selectedSemester = semesters.find((s) => String(s.id) === semId);
  const isIrregular = enrolledStatus === "Irregular";

  const yearOptions = yearLevelIds.filter((y) => y <= (selectedProgram?.lengthYears ?? 6));

  const filteredSets = selectedProgram
    ? sets.filter((s) => s.program === selectedProgram.code && (!yearLevel || String(s.yearLevel) === yearLevel))
    : [];

  const filteredSubjects = !selectedProgram || !selectedSemester
    ? []
    : isIrregular
      ? subjects.filter((s) => s.program === selectedProgram.code && s.semester === selectedSemester.semesterNumber)
      : yearLevel
        ? subjects.filter(
            (s) =>
              s.program === selectedProgram.code &&
              String(s.yearLevel) === yearLevel &&
              s.semester === selectedSemester.semesterNumber,
          )
        : [];

  useEffect(() => {
    setSelectedSubjectIds(new Set());
  }, [programId, yearLevel, semId, enrolledStatus]);

  const allSubjectsSelected =
    filteredSubjects.length > 0 && filteredSubjects.every((s) => selectedSubjectIds.has(s.id));

  function toggleSubject(subjectId: number, checked: boolean) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(subjectId);
      else next.delete(subjectId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedSubjectIds(checked ? new Set(filteredSubjects.map((s) => s.id)) : new Set());
  }

  async function handleSubmit() {
    const resolvedSetId = isIrregular ? filteredSets[0]?.id : Number(setId);

    if (!programId || !yearLevel || !syId || !semId || !studentType || !enrolledStatus) {
      setError("Fill in all required fields.");
      return;
    }
    if (!resolvedSetId) {
      setError("Select a set.");
      return;
    }
    if (selectedSubjectIds.size === 0) {
      setError("Select at least one subject.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        programId: Number(programId),
        yearLevel: Number(yearLevel),
        setId: resolvedSetId,
        studentType,
        enrolledStatus,
        syId: Number(syId),
        semId: Number(semId),
        subjectIds: [...selectedSubjectIds],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <p className="font-body text-sm text-slate-600 dark:text-slate-300">
        Enrolling <span className="font-medium text-navy-700 dark:text-mist-100">
          {student.lastName}, {student.firstName}
        </span>{" "}
        into a new term.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldChrome id="enroll-program" label="Program" required>
          <Select
            items={[
              { value: "", label: "Select a program" },
              ...programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
            ]}
            value={programId}
            onValueChange={(v) => setProgramId(v as string)}
          >
            <SelectTrigger id="enroll-program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a program</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="enroll-status" label="Enrolled Status" required>
          <Select
            items={[
              { value: "", label: "Select a status" },
              ...academicStatuses.map((s) => ({ value: s, label: s })),
            ]}
            value={enrolledStatus}
            onValueChange={(v) => setEnrolledStatus(v as string)}
          >
            <SelectTrigger id="enroll-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a status</SelectItem>
              {academicStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="enroll-type" label="Student Type" required>
          <Select
            items={[
              { value: "", label: "Select a type" },
              ...studentTypes.map((t) => ({ value: t, label: t })),
            ]}
            value={studentType}
            onValueChange={(v) => setStudentType(v as string)}
          >
            <SelectTrigger id="enroll-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a type</SelectItem>
              {studentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="enroll-year" label="Year Level" required>
          <Select
            items={[
              { value: "", label: "Select a year" },
              ...yearOptions.map((y) => ({ value: String(y), label: yearLevelLabel(y) })),
            ]}
            value={yearLevel}
            onValueChange={(v) => setYearLevel(v as string)}
          >
            <SelectTrigger id="enroll-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a year</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {yearLevelLabel(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        {!isIrregular && (
          <FieldChrome id="enroll-set" label="Set" required>
            <Select
              items={[
                { value: "", label: "Select a set" },
                ...filteredSets.map((s) => ({ value: String(s.id), label: s.setCode })),
              ]}
              value={setId}
              onValueChange={(v) => setSetId(v as string)}
            >
              <SelectTrigger id="enroll-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a set</SelectItem>
                {filteredSets.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.setCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        )}

        <FieldChrome id="enroll-sy" label="School Year" required>
          <Select
            items={[
              { value: "", label: "Select a school year" },
              ...schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear })),
            ]}
            value={syId}
            onValueChange={(v) => setSyId(v as string)}
          >
            <SelectTrigger id="enroll-sy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a school year</SelectItem>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={String(sy.id)}>
                  {sy.schoolYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="enroll-sem" label="Semester" required>
          <Select
            items={[
              { value: "", label: "Select a semester" },
              ...semesters.map((s) => ({ value: String(s.id), label: s.semester })),
            ]}
            value={semId}
            onValueChange={(v) => setSemId(v as string)}
          >
            <SelectTrigger id="enroll-sem">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a semester</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-slate-600 dark:text-slate-300">Enrolled Subjects</span>
          {filteredSubjects.length > 0 && (
            <Checkbox
              id="enroll-subjects-select-all"
              label="Select All"
              checked={allSubjectsSelected}
              onChange={toggleSelectAll}
            />
          )}
        </div>
        <div className="mt-1 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
          {filteredSubjects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a program, year level, semester, and status to list subjects.
            </p>
          ) : (
            filteredSubjects.map((s) => (
              <Checkbox
                key={s.id}
                id={`enroll-subject-${s.id}`}
                label={`${s.code} — ${s.title} (${s.units} units)`}
                checked={selectedSubjectIds.has(s.id)}
                onChange={(checked) => toggleSubject(s.id, checked)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          block={false}
          isLoading={isLoading}
          loadingLabel="Enrolling…"
          onClick={handleSubmit}
        >
          Enroll
        </Button>
      </div>
    </div>
  );
}
