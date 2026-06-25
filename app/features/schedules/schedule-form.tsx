import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import type { Faculty } from "../../types/faculty";
import type { Program } from "../../types/program";
import type { Room } from "../../types/room";
import { scheduleSchema } from "../../schemas/schedule.schema";
import {
  DAYS,
  DAY_LABELS,
  SCHEDULE_MODES,
  SCHEDULE_MODE_LABELS,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  generateTimeSlots,
  formatTime,
  type CreateScheduleInput,
  type Day,
  type Schedule,
  type ScheduleMode,
  type ScheduleSemester,
} from "../../types/schedule";
import type { ClassSet } from "../../types/set";
import type { Subject } from "../../types/subject";
import { YEAR_LEVELS, YEAR_LEVEL_LABELS, type YearLevel } from "../../types/subject";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProgram, setSelectedProgram] = useState<string>(
    schedule?.program ?? programs[0]?.code ?? "",
  );

  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">(
    schedule?.yearLevel ??
      (YEAR_LEVELS.find((yl) =>
        subjects.some((s) => s.program === (schedule?.program ?? programs[0]?.code ?? "") && s.yearLevel === yl),
      ) ?? ""),
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    schedule?.subjectId ?? "",
  );

  const availableYearLevels = YEAR_LEVELS.filter((yl) =>
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
    : (availableSubjects[0]?.id ?? "");

  const activeFaculty = faculty.filter((f) => f.status === "active");

  function handleProgramChange(program: string) {
    setSelectedProgram(program);
    const newYl =
      YEAR_LEVELS.find((yl) => subjects.some((s) => s.program === program && s.yearLevel === yl)) ??
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
        <Select
          id="sched-school-year"
          label="School Year"
          defaultValue={schedule?.schoolYear ?? defaultSchoolYear}
        >
          {SCHOOL_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <Select
          id="sched-semester"
          label="Semester"
          defaultValue={schedule?.semester ?? defaultSemester}
        >
          {SCHEDULE_SEMESTERS.map((s) => (
            <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="sched-program"
          label="Program"
          value={selectedProgram}
          onChange={(e) => handleProgramChange(e.target.value)}
        >
          {programs.map((p) => (
            <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
          ))}
        </Select>
        <Select
          id="sched-year-level"
          label="Year Level"
          value={selectedYearLevel}
          onChange={(e) => handleYearLevelChange(Number(e.target.value) as YearLevel)}
        >
          {availableYearLevels.length === 0 ? (
            <option value="">No year levels</option>
          ) : (
            availableYearLevels.map((yl) => (
              <option key={yl} value={yl}>{YEAR_LEVEL_LABELS[yl]}</option>
            ))
          )}
        </Select>
      </div>

      <Select
        id="sched-subject"
        label="Subject"
        value={effectiveSubjectId}
        onChange={(e) => setSelectedSubjectId(e.target.value)}
      >
        {availableSubjects.length === 0 ? (
          <option value="">No subjects for this program &amp; year level</option>
        ) : (
          [...availableSubjects]
            .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.title}
              </option>
            ))
        )}
      </Select>

      <Select
        id="sched-set"
        label="Set"
        defaultValue={schedule?.setId ?? availableSets[0]?.id}
        key={`${selectedProgram}-${selectedYearLevel}`}
      >
        {availableSets.length === 0 ? (
          <option value="">No sets for this program &amp; year level</option>
        ) : (
          availableSets.map((s) => (
            <option key={s.id} value={s.id}>
              Set {s.setCode}
            </option>
          ))
        )}
      </Select>

      <Select
        id="sched-faculty"
        label="Faculty"
        defaultValue={schedule?.facultyId ?? activeFaculty[0]?.id}
      >
        {activeFaculty.map((f) => (
          <option key={f.id} value={f.id}>
            {f.lastName}, {f.firstName} ({f.departmentCode})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="sched-room"
          label="Room"
          defaultValue={schedule?.roomId ?? rooms[0]?.id}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.buildingCode} — {r.name} (cap. {r.capacity}, {r.type})
            </option>
          ))}
        </Select>

        <Select id="sched-mode" label="Mode" defaultValue={schedule?.mode ?? "F2F"}>
          {SCHEDULE_MODES.map((m) => (
            <option key={m} value={m}>{SCHEDULE_MODE_LABELS[m]}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Select id="sched-day" label="Day" defaultValue={schedule?.day ?? "M"}>
          {DAYS.map((d) => (
            <option key={d} value={d}>{DAY_LABELS[d]}</option>
          ))}
        </Select>
        <Select id="sched-start" label="Start Time" defaultValue={schedule?.startTime ?? "07:00"}>
          {TIME_SLOTS.slice(0, -1).map((t) => (
            <option key={t} value={t}>{formatTime(t)}</option>
          ))}
        </Select>
        <Select id="sched-end" label="End Time" defaultValue={schedule?.endTime ?? "10:00"}>
          {TIME_SLOTS.slice(1).map((t) => (
            <option key={t} value={t}>{formatTime(t)}</option>
          ))}
        </Select>
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
