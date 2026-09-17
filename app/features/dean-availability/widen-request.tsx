import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { deanAvailabilityService } from "~/services/dean-availability.service";
import type {
  AvailabilityWidenRequest,
  AvailabilityWindow,
  InstructorAvailabilityRow,
} from "~/types/dean-instructor-availability";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Draft = AvailabilityWindow & { key: string };

let keySeed = 0;
const nextKey = () => `wreq_${++keySeed}`;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
}

const controlClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-body text-sm text-navy-800 " +
  "focus-visible:border-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/30 " +
  "dark:border-white/15 dark:bg-surface-raised dark:text-mist-100";

function windowLine(w: AvailabilityWindow): string {
  return `${w.dayOfWeek} ${w.startTime}–${w.endTime}`;
}

export function WidenRequestForm({
  row,
  syId,
  semesterNumber,
  onSent,
}: {
  row: InstructorAvailabilityRow;
  syId: number;
  semesterNumber: number;
  onSent: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sending, setSending] = useState(false);

  const backwards = drafts.filter((w) => timeToMinutes(w.endTime) <= timeToMinutes(w.startTime));
  const ready = reason.trim().length > 0 && drafts.length > 0 && backwards.length === 0;

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {row.name}&rsquo;s availability is configured by their academic dean
          {row.departmentAbbrev ? ` (${row.departmentAbbrev})` : ""}. If this availability window blocks a required
          subject offering, request the dean to widen the hours.
        </p>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Request to widen hours
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3.5">
      <Textarea
        id="widen-reason"
        label="Reason for request"
        hint="Explain which required class is blocked and why alternate time slots cannot fit."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="e.g. Required general education lecture conflicts with section's major laboratory classes."
      />

      <Input
        id="widen-subject"
        label="Subject code (optional)"
        hint="Identify the specific subject code requiring these instructor hours."
        value={subjectCode}
        onChange={(e) => setSubjectCode(e.target.value)}
        maxLength={50}
        placeholder="e.g. GE ELEC 1"
      />

      <div>
        <p className="mb-1.5 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Requested Hours
        </p>
        {drafts.length === 0 ? (
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            Specify the additional hours needed so the dean can review and apply them directly.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((w) => (
              <div key={w.key} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Day"
                  value={w.dayOfWeek}
                  onChange={(e) =>
                    setDrafts((curr) =>
                      curr.map((d) => (d.key === w.key ? { ...d, dayOfWeek: e.target.value } : d)),
                    )
                  }
                  className={`${controlClass} cursor-pointer`}
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  aria-label="Start time"
                  value={w.startTime}
                  onChange={(e) =>
                    setDrafts((curr) =>
                      curr.map((d) => (d.key === w.key ? { ...d, startTime: e.target.value } : d)),
                    )
                  }
                  className={`${controlClass} tabular-nums`}
                />
                <span className="font-body text-slate-400 dark:text-slate-500">to</span>
                <input
                  type="time"
                  aria-label="End time"
                  value={w.endTime}
                  onChange={(e) =>
                    setDrafts((curr) =>
                      curr.map((d) => (d.key === w.key ? { ...d, endTime: e.target.value } : d)),
                    )
                  }
                  className={`${controlClass} tabular-nums`}
                />
                <button
                  type="button"
                  onClick={() => setDrafts((curr) => curr.filter((d) => d.key !== w.key))}
                  aria-label={`Remove ${windowLine(w)}`}
                  className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-white/10"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setDrafts((curr) => [
              ...curr,
              {
                dayOfWeek: "Monday",
                startTime: "07:00",
                endTime: "18:00",
                key: nextKey(),
              },
            ])
          }
          className="mt-2 inline-flex cursor-pointer items-center gap-1 font-body text-xs font-semibold text-navy-700 hover:underline dark:text-gold-300"
        >
          <PlusIcon size={14} />
          Add time window
        </button>

        {backwards.length > 0 && (
          <p className="mt-1 font-body text-xs text-red-600 dark:text-red-400">
            End time must be after start time.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button
          disabled={!ready || sending}
          isLoading={sending}
          onClick={async () => {
            setSending(true);
            try {
              await deanAvailabilityService.requestWiden(
                row.instructorProfileId,
                syId,
                semesterNumber,
                {
                  reason: reason.trim(),
                  subjectCode: subjectCode.trim() || null,
                  windows: drafts.map(({ dayOfWeek, startTime, endTime }) => ({
                    dayOfWeek,
                    startTime,
                    endTime,
                  })),
                },
              );
              toast.success(`Widen request submitted to ${row.name}'s dean.`);
              setOpen(false);
              setReason("");
              setSubjectCode("");
              setDrafts([]);
              onSent();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not send the request.");
            } finally {
              setSending(false);
            }
          }}
        >
          Submit request to dean
        </Button>
        <Button variant="outline" disabled={sending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function WidenRequestInbox({
  requests,
  readOnly,
  onDecided,
}: {
  requests: AvailabilityWidenRequest[];
  readOnly: boolean;
  onDecided: () => void;
}) {
  if (requests.length === 0) return null;

  return (
    <Card className="border-gold-300 bg-gold-50/50 p-4 dark:border-gold-400/30 dark:bg-gold-400/8">
      <div className="flex items-center justify-between gap-2 border-b border-gold-200 pb-3 dark:border-gold-400/20">
        <div>
          <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
            {readOnly
              ? `${requests.length} Sent Widen Request${requests.length === 1 ? "" : "s"}`
              : `${requests.length} Pending Widen Request${requests.length === 1 ? "" : "s"} from Registrar`}
          </h2>
          <p className="font-body text-xs text-slate-600 dark:text-slate-300">
            {readOnly
              ? "Requests sent to academic deans to open additional teaching availability hours."
              : "The registrar requested widened teaching availability for scheduling conflicts. Approving immediately opens the hours."}
          </p>
        </div>
      </div>

      <ul className="mt-3 flex list-none flex-col gap-3">
        {requests.map((request) => (
          <WidenRequestRow
            key={request.id}
            request={request}
            readOnly={readOnly}
            onDecided={onDecided}
          />
        ))}
      </ul>
    </Card>
  );
}

function WidenRequestRow({
  request,
  readOnly,
  onDecided,
}: {
  request: AvailabilityWidenRequest;
  readOnly: boolean;
  onDecided: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    try {
      await deanAvailabilityService.decideWidenRequest(request.id, decision, message.trim());
      toast.success(
        decision === "approved"
          ? `${request.instructorName ?? "Instructor"} availability was widened.`
          : "Request was declined.",
      );
      onDecided();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-surface-raised">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              {request.instructorName}
            </span>
            {request.subjectCode && (
              <Badge tone="blue">{request.subjectCode}</Badge>
            )}
          </div>

          <p className="mt-1 font-body text-xs font-medium tabular-nums text-navy-700 dark:text-mist-100">
            Requested: {request.windows.map(windowLine).join(" · ")}
          </p>

          <p className="mt-1.5 border-l-2 border-slate-300 pl-2 font-body text-xs italic text-slate-600 dark:border-white/20 dark:text-slate-300">
            &ldquo;{request.reason}&rdquo;
          </p>

          {request.requestedBy && (
            <p className="mt-1 font-body text-xs text-slate-400 dark:text-slate-500">
              Requested by {request.requestedBy}
            </p>
          )}
        </div>

        {request.status !== "pending" && (
          <Badge tone={request.status === "approved" ? "emerald" : "slate"}>
            {request.status === "approved" ? "Approved" : "Declined"}
          </Badge>
        )}
      </div>

      {request.status !== "pending" && request.decisionMessage && (
        <p className="mt-2 font-body text-xs text-slate-600 dark:text-slate-300">
          {request.decidedBy ? `${request.decidedBy}: ` : ""}
          {request.decisionMessage}
        </p>
      )}

      {!readOnly && request.status === "pending" && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-100 pt-3 dark:border-white/5">
          {rejecting && (
            <Textarea
              id={`widen-decline-${request.id}`}
              label="Decline reason"
              hint="Provide explanation for why these hours cannot be granted."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="e.g. Instructor already has conflicting institutional assignments."
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!rejecting && (
              <Button disabled={busy} isLoading={busy} onClick={() => decide("approved")}>
                Approve & widen hours
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy || (rejecting && message.trim().length === 0)}
              onClick={() => (rejecting ? decide("rejected") : setRejecting(true))}
            >
              {rejecting ? "Confirm decline" : "Decline"}
            </Button>
            {rejecting && (
              <Button variant="outline" disabled={busy} onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
