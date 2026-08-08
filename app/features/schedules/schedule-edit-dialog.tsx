import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { timeToMinutes } from "~/lib/time";
import { SCHEDULE_MODES, type ScheduleMode } from "~/types/schedule";
import type { ScheduleRoomOption } from "~/services/schedule.service";

export type ScheduleEditForm = {
  dayName: string;
  startTime: string;
  endTime: string;
  roomId: string;
  mode: ScheduleMode;
};

type ScheduleEditDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  form: ScheduleEditForm;
  onFormChange: Dispatch<SetStateAction<ScheduleEditForm>>;
  dayOptions: { id: number; name: string }[];
  rooms: ScheduleRoomOption[];
  timeOptions: string[];
  saving: boolean;
  error: string | null;
  /** Warn that saving an approved schedule unpublishes it until re-approval. */
  approvedWarning?: boolean;
  /** Disable saving (e.g. the term is closed) with an explanatory note. */
  disabled?: boolean;
  disabledNote?: string;
};

/** Edit a single saved class placement (day, mode, time, room). */
export function ScheduleEditDialog({
  open,
  title,
  onClose,
  onSubmit,
  form,
  onFormChange,
  dayOptions,
  rooms,
  timeOptions,
  saving,
  error,
  approvedWarning = false,
  disabled = false,
  disabledNote,
}: ScheduleEditDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={title}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormError message={error} />
        {approvedWarning && (
          <Alert variant="warning">
            <AlertIcon />
            <AlertDescription>
              Saving will unpublish this schedule. Students and instructors will lose access until the
              dean approves it again.
            </AlertDescription>
          </Alert>
        )}
        {disabled && disabledNote && (
          <Alert variant="warning">
            <AlertIcon />
            <AlertDescription>{disabledNote} You cannot save changes.</AlertDescription>
          </Alert>
        )}
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Update the saved class placement. The backend will validate conflicts and room rules.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldChrome id="edit-day" label="Day">
            <Select
              items={dayOptions.map((option) => ({ value: option.name, label: option.name }))}
              value={form.dayName}
              onValueChange={(value) => onFormChange((current) => ({ ...current, dayName: value as string }))}
            >
              <SelectTrigger id="edit-day"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dayOptions.map((option) => (
                  <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="edit-mode" label="Mode">
            <Select
              items={SCHEDULE_MODES.map((mode) => ({ value: mode, label: mode }))}
              value={form.mode}
              onValueChange={(value) => onFormChange((current) => ({ ...current, mode: value as ScheduleMode }))}
            >
              <SelectTrigger id="edit-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEDULE_MODES.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="edit-start-time" label="Start time">
            <Select
              items={timeOptions.map((time) => ({ value: time, label: time }))}
              value={form.startTime}
              onValueChange={(value) => onFormChange((current) => ({ ...current, startTime: value as string }))}
            >
              <SelectTrigger id="edit-start-time"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="edit-end-time" label="End time">
            <Select
              items={timeOptions
                .filter((time) => timeToMinutes(time) > timeToMinutes(form.startTime))
                .map((time) => ({ value: time, label: time }))}
              value={form.endTime}
              onValueChange={(value) => onFormChange((current) => ({ ...current, endTime: value as string }))}
            >
              <SelectTrigger id="edit-end-time"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeOptions
                  .filter((time) => timeToMinutes(time) > timeToMinutes(form.startTime))
                  .map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </div>
        <FieldChrome id="edit-room" label="Room">
          <Select
            items={rooms.map((room) => ({ value: String(room.id), label: `${room.roomName} (${room.buildingName})` }))}
            value={form.roomId}
            onValueChange={(value) => onFormChange((current) => ({ ...current, roomId: value as string }))}
          >
            <SelectTrigger id="edit-room"><SelectValue placeholder="Select a room" /></SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={String(room.id)}>{room.roomName} ({room.buildingName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" block={false} disabled={disabled} isLoading={saving} loadingLabel="Saving…">
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
