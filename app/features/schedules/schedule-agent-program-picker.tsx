import { useEffect, useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { programService } from "~/services/program.service";
import { scheduleAgentService } from "~/services/schedule-agent.service";
import type { Program } from "~/types/program";
import type {
  ScheduleAgentSubmissionOption,
} from "~/types/schedule-agent";

type ProgramChoice = Pick<Program, "id" | "abbrev" | "name">;

type ScheduleAgentProgramPickerProps = {
  open: boolean;
  onClose: () => void;
  fixedSubmission?: ScheduleAgentSubmissionOption | null;
  fixedPrograms?: ProgramChoice[];
  schoolYears: { id: number; schoolYear: string }[];
  semesterLabel: (semesterNumber: number) => string;
  onGenerate: (submission: ScheduleAgentSubmissionOption, program: ProgramChoice) => void;
};

export function ScheduleAgentProgramPicker({
  open,
  onClose,
  fixedSubmission,
  fixedPrograms,
  schoolYears,
  semesterLabel,
  onGenerate,
}: ScheduleAgentProgramPickerProps) {
  const [submissions, setSubmissions] = useState<ScheduleAgentSubmissionOption[]>([]);
  const [programs, setPrograms] = useState<ProgramChoice[]>([]);
  const [submissionId, setSubmissionId] = useState("");
  const [programId, setProgramId] = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === Number(submissionId)) ?? null,
    [submissionId, submissions],
  );
  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === Number(programId)) ?? null,
    [programId, programs],
  );

  useEffect(() => {
    if (!open) return;

    setError(null);
    setProgramId("");
    setPrograms([]);

    if (fixedSubmission) {
      setLoadingSubmissions(false);
      setSubmissions([fixedSubmission]);
      setSubmissionId(String(fixedSubmission.id));
      return;
    }

    let active = true;
    setSubmissionId("");
    setSubmissions([]);
    setLoadingSubmissions(true);
    void scheduleAgentService
      .getSubmissions()
      .then((items) => {
        if (active) setSubmissions(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load submissions.");
      })
      .finally(() => {
        if (active) setLoadingSubmissions(false);
      });

    return () => {
      active = false;
    };
  }, [fixedSubmission, open]);

  useEffect(() => {
    if (!open || !selectedSubmission) return;

    setError(null);
    setProgramId("");
    if (fixedPrograms && fixedSubmission?.id === selectedSubmission.id) {
      setLoadingPrograms(false);
      setPrograms(fixedPrograms);
      return;
    }

    let active = true;
    setPrograms([]);
    setLoadingPrograms(true);
    void programService
      .list(selectedSubmission.departmentId)
      .then((items: Program[]) => {
        if (active) setPrograms(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load programs.");
      })
      .finally(() => {
        if (active) setLoadingPrograms(false);
      });

    return () => {
      active = false;
    };
  }, [fixedPrograms, fixedSubmission?.id, open, selectedSubmission]);

  const schoolYear = selectedSubmission
    ? schoolYears.find((item) => item.id === selectedSubmission.syId)?.schoolYear
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate complete program schedule"
    >
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Marvis will build proposals for every class set in the selected program. This may take several minutes.
        </p>

        <FormError message={error} />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="marvis-program-submission"
            className="font-body text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            Department submission
          </label>
          <Select
            items={submissions.map((submission) => ({
              value: String(submission.id),
              label: `${submission.departmentName} · ${submission.departmentAbbrev}`,
            }))}
            value={submissionId}
            onValueChange={(value) => setSubmissionId(value as string)}
          >
            <SelectTrigger
              id="marvis-program-submission"
              disabled={Boolean(fixedSubmission) || loadingSubmissions}
            >
              <SelectValue
                placeholder={loadingSubmissions ? "Loading submissions…" : "Choose a department"}
              />
            </SelectTrigger>
            <SelectContent>
              {submissions.map((submission) => (
                <SelectItem key={submission.id} value={String(submission.id)}>
                  {submission.departmentName} · {submission.departmentAbbrev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSubmission ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="slate">
                {selectedSubmission.status.replace(/_/g, " ")}
              </Badge>
              <span className="font-body text-[11px] text-slate-500 dark:text-slate-400">
                {schoolYear ?? `School year #${selectedSubmission.syId}`} ·{" "}
                {semesterLabel(selectedSubmission.semesterNumber)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="marvis-program"
            className="font-body text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            Program
          </label>
          <Select
            items={programs.map((program) => ({
              value: String(program.id),
              label: `${program.abbrev} · ${program.name}`,
            }))}
            value={programId}
            onValueChange={(value) => setProgramId(value as string)}
          >
            <SelectTrigger
              id="marvis-program"
              disabled={!selectedSubmission || loadingPrograms}
            >
              <SelectValue
                placeholder={
                  !selectedSubmission
                    ? "Choose a department first"
                    : loadingPrograms
                      ? "Loading programs…"
                      : programs.length === 0
                        ? "No programs in this department"
                        : "Choose a program"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={String(program.id)}>
                  {program.abbrev} · {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-white/8">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            block={false}
            disabled={!selectedSubmission || !selectedProgram}
            onClick={() => {
              if (selectedSubmission && selectedProgram) {
                onGenerate(selectedSubmission, selectedProgram);
              }
            }}
          >
            Start generation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
