import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Faculty } from "~/types/faculty";
import type { Program } from "~/types/program";
import type { Room } from "~/types/room";
import { scheduleSchema } from "~/schemas/schedule.schema";
import {
  DAYS,
  DAY_LABELS,
  generateTimeSlots,
  formatTime,
  type CreateScheduleInput,
  type Day,
  type Schedule,
  type ScheduleMode,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";
import type { YearLevel } from "~/types/subject";
import { useSemesters } from "~/hooks/use-semesters";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useYearLevels } from "~/hooks/use-year-levels";
import { useClassModes } from "~/hooks/use-class-modes";

type ScheduleFormProps = {
  schedule?: Schedule;
  programs: Program[];
  subjects: Subject[];
  sets: ClassSet[];
  faculty: Faculty[];
  rooms: Room[];
  defaultSchoolYear: string;
  defaultSemester: ScheduleSemester;
  onSubmit: (input: CreateScheduleInput) => Promise<void>;
  onCancel: () => void;
};

const TIME_SLOTS = generateTimeSlots();

export function ScheduleForm({
  schedule,
  programs,
  subjects,
  sets,
  faculty,
  rooms,
  defaultSchoolYear,
  defaultSemester,
  onSubmit,
  onCancel,
}: ScheduleFormProps) {
  const { semesters, semesterLabel } = useSemesters();
  const { schoolYears } = useSchoolYears();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const { classModes } = useClassModes();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProgram, setSelectedProgram] = useState<string>(
    schedule?.program ?? programs[0]?.code ?? "",
  );

  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">(
    schedule?.yearLevel ??
      (yearLevelIds.find((yl) =>
        subjects.some((s) => s.program === (schedule?.program ?? programs[0]?.code ?? "") && s.yearLevel === yl),
      ) ?? ""),
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    schedule?.subjectId ?? "",
  );

  const availableYearLevels = yearLevelIds.filter((yl) =>
    subjects.some((s) => s.program === selectedProgram && s.yearLevel === yl),
  );

  const availableSubjects = subjects.filter(
    (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel,
  );

  const availableSets = sets.filter(
    (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel,
  );

  const effectiveSubjectId = availableSubjects.some((s) => s.id === selectedSubjectId)
    ? selectedSubjectId
    : String(availableSubjects[0]?.id ?? "");

  const activeFaculty = faculty.filter((f) => f.status === "active");

  function handleProgramChange(program: string) {
    setSelectedProgram(program);
    const newYl =
      yearLevelIds.find((yl) => subjects.some((s) => s.program === program && s.yearLevel === yl)) ??
      (1 as YearLevel);
    setSelectedYearLevel(newYl);
    setSelectedSubjectId(subjects.find((s) => s.program === program && s.yearLevel === newYl)?.id ?? "");
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSubjectId(subjects.find((s) => s.program === selectedProgram && s.yearLevel === yl)?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const schoolYear = String(data.get("sched-school-year") ?? "");
    const semester = Number(data.get("sched-semester")) as ScheduleSemester;
    const subjectId = String(data.get("sched-subject") ?? "");
    const setId = String(data.get("sched-set") ?? "");
    const facultyId = String(data.get("sched-faculty") ?? "");
    const roomId = String(data.get("sched-room") ?? "");
    const mode = String(data.get("sched-mode") ?? "") as ScheduleMode;
    const day = String(data.get("sched-day") ?? "") as Day;
    const startTime = String(data.get("sched-start") ?? "");
    const endTime = String(data.get("sched-end") ?? "");

    const result = scheduleSchema.safeParse({ subjectId, setId, facultyId, roomId, mode, day, startTime, endTime });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const subject = subjects.find((s) => s.id === subjectId);
    const set = sets.find((s) => s.id === setId);
    const member = faculty.find((f) => f.id === facultyId);
    const room = rooms.find((r) => r.id === roomId);

    if (!subject || !set || !member || !room) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        schoolYear,
        semester,
        subjectId: result.data.subjectId,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        setId: result.data.setId,
        setCode: set.setCode,
        program: set.program,
        departmentCode: programs.find((p) => p.code === set.program)?.departmentCode ?? "",
        yearLevel: set.yearLevel,
        facultyId: result.data.facultyId,
        facultyName: `${member.firstName} ${member.lastName}`,
        roomId: result.data.roomId,
        roomName: room.name,
        buildingCode: room.buildingCode,
        mode: result.data.mode,
        day: result.data.day as Day,
        startTime: result.data.startTime,
        endTime: result.data.endTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="sched-school-year" label="School Year">
          <Select
            items={schoolYears.map((y) => ({ value: y.schoolYear, label: y.schoolYear }))}
            name="sched-school-year"
            defaultValue={schedule?.schoolYear ?? defaultSchoolYear}
          >
            <SelectTrigger id="sched-school-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((y) => (
                <SelectItem key={y.id} value={y.schoolYear}>
                  {y.schoolYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="sched-semester" label="Semester">
          <Select
            items={semesters.map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
            name="sched-semester"
            defaultValue={String(schedule?.semester ?? defaultSemester)}
          >
            <SelectTrigger id="sched-semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.semesterNumber)}>
                  {semesterLabel(s.semesterNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="sched-program" label="Program">
          <Select
            items={programs.map((p) => ({ value: p.code, label: `${p.code} — ${p.name}` }))}
            value={selectedProgram}
            onValueChange={(v) => handleProgramChange(v as string)}
          >
            <SelectTrigger id="sched-program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="sched-year-level" label="Year Level">
          <Select
            items={
              availableYearLevels.length === 0
                ? [{ value: "", label: "No year levels" }]
                : availableYearLevels.map((yl) => ({ value: String(yl), label: yearLevelLabel(yl) }))
            }
            value={String(selectedYearLevel)}
            onValueChange={(v) => handleYearLevelChange(Number(v) as YearLevel)}
          >
            <SelectTrigger id="sched-year-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYearLevels.length === 0 ? (
                <SelectItem value="">No year levels</SelectItem>
              ) : (
                availableYearLevels.map((yl) => (
                  <SelectItem key={yl} value={String(yl)}>
                    {yearLevelLabel(yl)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <FieldChrome id="sched-subject" label="Subject">
        <Select
          items={
            availableSubjects.length === 0
              ? [{ value: "", label: "No subjects for this program & year level" }]
              : [...availableSubjects]
                  .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
                  .map((s) => ({ value: String(s.id), label: `${s.code} — ${s.title}` }))
          }
          value={effectiveSubjectId}
          onValueChange={(v) => setSelectedSubjectId(v as string)}
        >
          <SelectTrigger id="sched-subject">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableSubjects.length === 0 ? (
              <SelectItem value="">No subjects for this program &amp; year level</SelectItem>
            ) : (
              [...availableSubjects]
                .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
                .map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} — {s.title}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome id="sched-set" label="Set">
        <Select
          items={
            availableSets.length === 0
              ? [{ value: "", label: "No sets for this program & year level" }]
              : availableSets.map((s) => ({ value: String(s.id), label: `Set ${s.setCode}` }))
          }
          name="sched-set"
          defaultValue={schedule?.setId ?? String(availableSets[0]?.id ?? "")}
          key={`${selectedProgram}-${selectedYearLevel}`}
        >
          <SelectTrigger id="sched-set">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableSets.length === 0 ? (
              <SelectItem value="">No sets for this program &amp; year level</SelectItem>
            ) : (
              availableSets.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  Set {s.setCode}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome id="sched-faculty" label="Faculty">
        <Select
          items={activeFaculty.map((f) => ({
            value: String(f.id),
            label: `${f.lastName}, ${f.firstName} (${f.departmentCode})`,
          }))}
          name="sched-faculty"
          defaultValue={schedule?.facultyId ?? String(activeFaculty[0]?.id ?? "")}
        >
          <SelectTrigger id="sched-faculty">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeFaculty.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.lastName}, {f.firstName} ({f.departmentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="sched-room" label="Room">
          <Select
            items={rooms.map((r) => ({
              value: String(r.id),
              label: `${r.buildingCode} — ${r.name} (cap. ${r.capacity}, ${r.type})`,
            }))}
            name="sched-room"
            defaultValue={schedule?.roomId ?? String(rooms[0]?.id ?? "")}
          >
            <SelectTrigger id="sched-room">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.buildingCode} — {r.name} (cap. {r.capacity}, {r.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="sched-mode" label="Mode">
          <Select
            items={classModes.map((m) => ({ value: m, label: m }))}
            name="sched-mode"
            defaultValue={schedule?.mode ?? "F2F"}
          >
            <SelectTrigger id="sched-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classModes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FieldChrome id="sched-day" label="Day">
          <Select items={DAYS.map((d) => ({ value: d, label: DAY_LABELS[d] }))} name="sched-day" defaultValue={schedule?.day ?? "M"}>
            <SelectTrigger id="sched-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DAY_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="sched-start" label="Start Time">
          <Select
            items={TIME_SLOTS.slice(0, -1).map((t) => ({ value: t, label: formatTime(t) }))}
            name="sched-start"
            defaultValue={schedule?.startTime ?? "07:00"}
          >
            <SelectTrigger id="sched-start">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.slice(0, -1).map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="sched-end" label="End Time">
          <Select
            items={TIME_SLOTS.slice(1).map((t) => ({ value: t, label: formatTime(t) }))}
            name="sched-end"
            defaultValue={schedule?.endTime ?? "10:00"}
          >
            <SelectTrigger id="sched-end">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.slice(1).map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {schedule ? "Save Changes" : "Add Schedule"}
        </Button>
      </div>
    </form>
  );
}
