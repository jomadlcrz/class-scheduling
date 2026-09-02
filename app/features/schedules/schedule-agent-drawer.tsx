import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  SparkleIcon,
} from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { reportRequestError } from "~/lib/form-error-summary";
import { formatDateTime, formatRelativeTime } from "~/lib/time";
import { scheduleAgentService } from "~/services/schedule-agent.service";
import type {
  ScheduleAgentApplyResult,
  ScheduleAgentApplyResultItem,
  ScheduleAgentConversationSummary,
  ScheduleAgentHistoryItem,
  ScheduleAgentModel,
  ScheduleAgentModelCatalog,
  ScheduleAgentProgramGenerationRequest,
  ScheduleAgentProgramProgress,
  ScheduleAgentProposedChange,
  ScheduleAgentProposedMeeting,
  ScheduleAgentResult,
  ScheduleAgentSolution,
  ScheduleAgentTarget,
  ScheduleAgentWorkspace,
} from "~/types/schedule-agent";

const PORTAL_SECTION_TITLE = "font-display text-sm tracking-wider text-navy-700 uppercase dark:text-mist-100";

type Exchange = {
  id: string;
  message: string;
  kind?: "chat" | "program";
  status: "pending" | "done" | "error";
  /** Only meaningful while status is "pending" — live Solver Agent reasoning. */
  phase?: "reasoning" | "drafting" | "revising" | "reviewing";
  createdAt?: string;
  reasoning?: string;
  progress?: ScheduleAgentProgramProgress;
  result?: ScheduleAgentResult;
  error?: string;
};

function toExchange(item: ScheduleAgentHistoryItem, conversationId: string): Exchange {
  return {
    id: String(item.proposalId),
    message: item.message,
    status: "done",
    createdAt: item.createdAt,
    result: { proposalId: item.proposalId, conversationId, solution: item.solution, review: item.review, status: item.status },
  };
}

type ScheduleAgentDrawerProps = {
  open: boolean;
  onClose: () => void;
  // "term" only ever comes from the Registrar's persistent launcher when no
  // department has submitted anything for the selected term yet -- every
  // other entry point (a specific row's "Ask Marvis Agent", or the
  // "Generate program" picker) always resolves a real submission.
  target: ScheduleAgentTarget;
  workspace: ScheduleAgentWorkspace;
  departmentName?: string;
  programGeneration?: ScheduleAgentProgramGenerationRequest | null;
};

const EXAMPLE_PROMPTS = [
  "What conflicts does this submission have right now?",
  "Find a free room for the conflicting meeting",
  "Resolve every conflict in this submission",
];

// Registrar authority has no department boundary (same scope as the real
// Apply-time conflict check), so its examples surface that instead of
// implying Marvis only knows about the one submission this thread opened
// from.
const REGISTRAR_EXAMPLE_PROMPTS = [
  "Are there any conflicts across departments right now?",
  "Which departments still have unresolved requirements this term?",
  "Resolve every conflict in this submission",
];

// No submission is open yet ("term" target, see ScheduleAgentTarget) --
// swap the submission-specific third example for one that still applies
// with nothing submitted yet.
const REGISTRAR_TERM_EXAMPLE_PROMPTS = [
  "Are there any conflicts across departments right now?",
  "Which departments still have unresolved requirements this term?",
  "What's the weekly hour policy for a Major-with-Lab subject?",
];

type AgentModelSelectProps = {
  id: string;
  label: string;
  models: ScheduleAgentModel[];
  value: string;
  placeholder: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
};

function AgentModelSelect({
  id,
  label,
  models,
  value,
  placeholder,
  disabled,
  onValueChange,
}: AgentModelSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-body text-[11px] font-semibold text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>
      <Select
        items={models.map((model) => ({ value: model.key, label: model.label }))}
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as string)}
      >
        <SelectTrigger id={id} disabled={disabled} className="h-9 py-1.5 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.key} value={model.key}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function pendingStatusLabel(exchange: Exchange): string {
  if (exchange.phase === "reviewing") {
    return exchange.kind === "program"
      ? "Reviewing the complete program proposal…"
      : "Reviewing the proposal…";
  }
  if (exchange.phase === "revising") {
    return exchange.kind === "program"
      ? "Found a conflict, revising the program proposal…"
      : "Found a conflict, revising…";
  }
  if (exchange.kind === "program" && exchange.progress) {
    const { phase, target, index, total } = exchange.progress;
    return phase === "target-done"
      ? `Completed ${target} (${index} of ${total})`
      : `Generating ${target} (${index} of ${total})…`;
  }
  if (exchange.phase === "drafting") return "Drafting the proposal…";
  return exchange.kind === "program"
    ? "Preparing the program schedule…"
    : "Thinking through your request…";
}

/** Humanizes a raw field name (year_level_plan, roomStrategy) into normal
 * words — never shown to the user as-is, same principle as the backend's
 * own jargon backstop for prose (see parsing.sanitize_solution_text). */
function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Renders any value as text without ever producing "[object Object]" —
 * the model isn't limited to the two documented change shapes in practice
 * (it has invented its own before), so nested objects/arrays need to
 * recurse into readable text instead of a naive String(value). */
function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatValue).join("; ") : "—";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length > 0
      ? entries.map(([key, val]) => `${humanizeKey(key)}: ${formatValue(val)}`).join(", ")
      : "—";
  }
  return String(value);
}

function formatSlot(value: Record<string, unknown> | undefined): string {
  if (!value) return "—";
  const parts: string[] = [];
  const day = value.day ?? value.day_of_week;
  const start = value.start_time_12h ?? value.start_time;
  const end = value.end_time_12h ?? value.end_time;
  const roomName = value.room_name;
  const roomId = value.room_id;
  if (day) parts.push(String(day));
  if (start && end) parts.push(`${start}–${end}`);
  else if (start) parts.push(String(start));
  if (roomName) parts.push(String(roomName));
  else if (roomId != null) parts.push(`room ${roomId}`);
  if (parts.length > 0) return parts.join(" · ");
  const entries = Object.entries(value);
  if (entries.length === 0) return "—";
  return entries.map(([key, val]) => `${humanizeKey(key)}: ${formatValue(val)}`).join(", ");
}

function formatMeeting(meeting: ScheduleAgentProposedMeeting): string {
  const parts: string[] = [];
  const displayStart = meeting.start_time_12h ?? meeting.start_time;
  const displayEnd = meeting.end_time_12h ?? meeting.end_time;
  if (meeting.day) parts.push(meeting.day);
  if (displayStart && displayEnd) parts.push(`${displayStart}–${displayEnd}`);
  if (meeting.room_name) parts.push(meeting.room_name);
  else if (meeting.room_id != null) parts.push(`room ${meeting.room_id}`);
  return parts.join(" · ") || "—";
}

const GENERIC_FIELD_SKIP = new Set(["action", "reason", "validation_status", "schedule_id"]);

/** Renders whatever the model put in a change that isn't a CREATE (has
 * meetings[]) or a MOVE/CHANGE_ROOM (has current/proposed slot objects) --
 * it has invented other shapes before (e.g. a "CREATE_FRAMEWORK" plan with
 * its own free-form fields), so this is the catch-all instead of forcing
 * everything through the two known layouts. */
function GenericChangeFields({ change }: { change: Record<string, unknown> }) {
  const entries = Object.entries(change).filter(
    ([key, val]) => !GENERIC_FIELD_SKIP.has(key) && val != null,
  );
  if (entries.length === 0) return null;
  return (
    <dl className="mt-2 flex flex-col gap-1.5">
      {entries.map(([key, val]) => (
        <div key={key}>
          <dt className="font-body text-[10.5px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {humanizeKey(key)}
          </dt>
          <dd className="mt-0.5 font-body text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {formatValue(val)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ChangeRow({ change }: { change: ScheduleAgentProposedChange }) {
  const isCreate = change.action?.toUpperCase() === "CREATE";
  const hasSlotShape = change.current != null || change.proposed != null;

  return (
    <div className="mb-2 rounded-lg bg-cream-100/60 p-3 last:mb-0 dark:bg-white/3">
      <div className="flex flex-wrap items-center gap-1.5">
        {isCreate ? (
          <>
            {change.subject_code && <Badge tone="navy">{change.subject_code}</Badge>}
            {change.set_name && <Badge tone="slate">{change.set_name}</Badge>}
          </>
        ) : (
          change.schedule_id != null && <Badge tone="navy">#{change.schedule_id}</Badge>
        )}
        {change.action && <Badge tone="gold">{change.action.replace(/_/g, " ")}</Badge>}
      </div>

      {isCreate ? (
        <>
          <p className="mt-2 font-body text-xs text-slate-600 dark:text-slate-300">
            Instructor: {change.instructor_name ?? (change.instructor_id ? `#${change.instructor_id}` : "TBA (floating)")}
          </p>
          {change.meetings && change.meetings.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {change.meetings.map((meeting, index) => (
                <li key={index} className="font-body text-xs">
                  <p className="text-navy-700 dark:text-gold-300">
                    {meeting.meeting_type && (
                      <span className="mr-1.5 font-semibold uppercase">{meeting.meeting_type}</span>
                    )}
                    {formatMeeting(meeting)}
                  </p>
                  {meeting.conflict_check?.conflicts && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200">
                      <span className="mt-px flex size-3.5 shrink-0 [&>svg]:size-3.5">
                        <AlertTriangleIcon />
                      </span>
                      <p className="leading-relaxed">
                        <span className="font-semibold">Conflict</span>
                        {meeting.conflict_check.detail && ` — ${meeting.conflict_check.detail}`}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : hasSlotShape ? (
        <p className="mt-2 font-body text-xs">
          <span className="text-slate-400 line-through dark:text-slate-500">
            {formatSlot(change.current)}
          </span>
          <span className="mx-1.5 text-slate-400 dark:text-slate-500">→</span>
          <span className="font-semibold text-navy-700 dark:text-gold-300">
            {formatSlot(change.proposed)}
          </span>
        </p>
      ) : (
        <GenericChangeFields change={change as unknown as Record<string, unknown>} />
      )}

      {change.reason && (
        <p className="mt-1.5 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {change.reason}
        </p>
      )}
      {change.validation_status && (
        <div className="mt-2">
          <Badge tone="slate">{change.validation_status}</Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the Solver Agent's free-form reply (solution.raw) as real markdown
 * instead of literal asterisks and pipe characters — it falls back to prose
 * whenever a request doesn't fit the structured proposal JSON (a plain
 * question, a greeting), and writes that prose in markdown by default.
 */
function AgentMarkdown({ children }: { children: string }) {
  return (
    <div className="mt-2 font-body text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      <Streamdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-navy-800 dark:text-mist-100">{children}</strong>
          ),
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
          h1: ({ children }) => (
            <p className="mb-1.5 font-display text-sm tracking-[0.075em] text-navy-700 dark:text-mist-100">
              {children}
            </p>
          ),
          h2: ({ children }) => (
            <p className="mb-1.5 font-display text-sm tracking-[0.075em] text-navy-700 dark:text-mist-100">
              {children}
            </p>
          ),
          h3: ({ children }) => (
            <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700 dark:bg-white/10 dark:text-slate-200">
              {children}
            </code>
          ),
          hr: () => <div className="my-2 h-px bg-slate-200 dark:bg-white/10" />,
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 dark:bg-white/5">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-slate-200 px-2 py-1.5 text-left font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 px-2 py-1.5 align-top dark:border-white/10">{children}</td>
          ),
        }}
      >
        {children}
      </Streamdown>
    </div>
  );
}

/** A proposal item this drawer can actually send to Apply -- CREATE with at
 * least one meeting, MOVE/CHANGE_ROOM with a schedule_id and a proposed
 * slot, or DELETE with a schedule_id. Anything else (a malformed item, or a
 * shape the model invented) is shown for review only, same as before this
 * existed. */
function isApplicableChange(change: ScheduleAgentProposedChange): boolean {
  const action = change.action?.toUpperCase();
  if (action === "CREATE") return (change.meetings?.length ?? 0) > 0;
  if (action === "MOVE" || action === "CHANGE_ROOM") {
    return change.schedule_id != null && change.proposed != null;
  }
  if (action === "DELETE") return change.schedule_id != null;
  return false;
}

/** One line summarizing what actually happened to one applied item --
 * mirrors apply_proposal's own per-item result shape (backend-truth: the
 * outcome word is decided here from action+success, everything else --
 * error text -- is the backend's own words verbatim). */
function describeApplyResult(result: ScheduleAgentApplyResultItem): string {
  const start = result.startTime12h ?? result.startTime;
  const end = result.endTime12h ?? result.endTime;
  const slot = result.day
    ? start && end
      ? `${result.day} ${start}–${end}`
      : result.day
    : null;
  const outcome = result.success
    ? result.action === "DELETE"
      ? "removed"
      : result.action === "MOVE" || result.action === "CHANGE_ROOM"
        ? `moved (schedule #${result.scheduleId})`
        : `created (schedule #${result.scheduleId})`
    : result.error;
  return slot ? `${slot} — ${outcome}` : (outcome ?? "");
}

function SolutionCard({
  solution,
  proposalId,
  status,
  createdAt,
}: {
  solution: ScheduleAgentSolution;
  proposalId: number;
  status: string;
  createdAt?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyResult, setApplyResult] = useState<ScheduleAgentApplyResult | null>(null);
  // Seeded from the persisted status (a proposal applied in an earlier
  // session/page load) and flipped locally the moment a fresh apply in
  // this session succeeds -- either way the button must never come back.
  const [applied, setApplied] = useState(status === "applied");

  const applicableItems = (solution.proposals ?? []).filter(isApplicableChange);
  const canApply = applicableItems.length > 0 && !applied;
  const changeCount = applicableItems.reduce(
    (total, item) =>
      total + (item.action?.toUpperCase() === "CREATE" ? (item.meetings?.length ?? 0) : 1),
    0,
  );

  async function handleApply() {
    const result = await scheduleAgentService.applyProposal(proposalId);
    setApplyResult(result);
    if (result.appliedCount > 0) {
      setApplied(true);
      toast.success(`Applied ${result.appliedCount} of ${result.appliedCount + result.failedCount} changes.`);
    }
    if (result.failedCount > 0) {
      toast.error(`${result.failedCount} change${result.failedCount === 1 ? "" : "s"} could not be applied.`);
    }
  }

  return (
    <Card className="border-slate-200 p-4 shadow-sm dark:border-white/10">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-gold-600 dark:bg-gold-400/10 dark:text-gold-300">
          <SparkleIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <span className={PORTAL_SECTION_TITLE}>Marvis Agent</span>
          {createdAt ? (
            <p
              title={formatDateTime(createdAt)}
              className="mt-0.5 font-body text-[10.5px] text-slate-400 dark:text-slate-500"
            >
              {formatRelativeTime(createdAt)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {solution.out_of_scope ? (
            <Badge tone="slate">OUT OF SCOPE</Badge>
          ) : solution.conflict_type ? (
            <Badge tone="red">{solution.conflict_type.replace(/_/g, " ")}</Badge>
          ) : null}
        </div>
      </div>

      {solution.out_of_scope ? (
        <p className="mt-2 font-body text-sm text-slate-600 dark:text-slate-300">
          {solution.reason ?? "This request is outside what the Marvis Agent can help with."}
        </p>
      ) : solution.parse_error ? (
        solution.raw ? (
          <AgentMarkdown>{solution.raw}</AgentMarkdown>
        ) : (
          <p className="mt-2 font-body text-sm text-slate-600 dark:text-slate-300">
            {solution.parse_error}
          </p>
        )
      ) : (
        <>
          {solution.summary && (
            <p className="mt-2 font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {solution.summary}
            </p>
          )}
          {solution.proposals && solution.proposals.length > 0 && (
            <>
              <div className="my-3 h-px bg-slate-200 dark:bg-white/8" />
              <p className="mb-2 font-body text-[10.5px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Proposed changes
              </p>
              {solution.proposals.map((change, index) => (
                <ChangeRow key={change.schedule_id ?? index} change={change} />
              ))}
            </>
          )}
          {solution.missing_information && solution.missing_information.length > 0 && (
            <div className="mt-3 flex gap-2 rounded-lg border-l-2 border-gold-500 bg-amber-50 p-3 dark:border-gold-400 dark:bg-gold-400/8">
              <AlertTriangleIcon />
              <p className="font-body text-xs leading-relaxed text-amber-800 dark:text-gold-200">
                <span className="font-semibold">Missing information</span> —{" "}
                {solution.missing_information.join("; ")}
              </p>
            </div>
          )}
        </>
      )}

      {canApply && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/8">
          <Button
            type="button"
            variant="primary"
            className="bg-emerald-600! hover:bg-emerald-700! text-white!"
            block={false}
            onClick={() => setConfirmOpen(true)}
          >
            Apply to timetable
          </Button>
        </div>
      )}

      {applied && !applyResult && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-3 dark:border-white/8">
          <CheckIcon size={14} />
          <p className="font-body text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Applied to the timetable
          </p>
        </div>
      )}

      {applyResult && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200 pt-3 dark:border-white/8">
          <p className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
            {applyResult.appliedCount} of {applyResult.appliedCount + applyResult.failedCount} change
            {applyResult.appliedCount + applyResult.failedCount === 1 ? "" : "s"} applied
          </p>
          {applyResult.results.map((result, index) => (
            <p
              key={index}
              className={`font-body text-xs ${
                result.success
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {result.success ? "✓" : "✗"} {describeApplyResult(result)}
            </p>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Apply this proposal?"
        confirmLabel="Apply"
        loadingLabel="Applying…"
        confirmVariant="primary"
        onConfirm={handleApply}
      >
        <div className="flex flex-col gap-3">
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            This applies {changeCount} change{changeCount === 1 ? "" : "s"} to the real timetable,
            still subject to the backend's own conflict and validation checks — a change that fails
            validation simply won't be made, and you'll see why.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {applicableItems.map((item, itemIndex) => {
              const action = item.action?.toUpperCase();
              return (
                <div key={itemIndex} className="rounded-lg bg-slate-50 p-2.5 dark:bg-white/5">
                  {action === "CREATE" ? (
                    <>
                      <p className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                        {item.subject_code ?? `Subject ${item.subject_id}`} —{" "}
                        {item.set_name ?? `Set ${item.set_id}`}
                      </p>
                      {(item.meetings ?? []).map((meeting, meetingIndex) => (
                        <p key={meetingIndex} className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
                          {meeting.meeting_type ?? "meeting"}: {formatMeeting(meeting)}
                        </p>
                      ))}
                    </>
                  ) : action === "DELETE" ? (
                    <>
                      <p className="font-body text-xs font-semibold text-red-700 dark:text-red-300">
                        Remove schedule #{item.schedule_id}
                      </p>
                      {item.reason && (
                        <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
                          {item.reason}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                        {action === "CHANGE_ROOM" ? "Change room" : "Move"} — schedule #{item.schedule_id}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
                        {formatSlot(item.current)} → {formatSlot(item.proposed)}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ConfirmDialog>
    </Card>
  );
}

/**
 * Advisory-only conversation with the Solver Agent (Marvis) for one Major
 * Scheduling Control submission. Each send is an independent backend call —
 * the agent has no memory of earlier turns in this drawer, only of the
 * submission's current schedule (fetched server-side per request).
 *
 * The backend also runs a Reviewer Agent critique alongside every solve
 * call, but it isn't surfaced in this UI.
 *
 * CREATE, MOVE, CHANGE_ROOM, and DELETE proposals can all be applied to the
 * real timetable (behind a confirm step, in SolutionCard/isApplicableChange).
 * MOVE/CHANGE_ROOM on the Dean side is a delete+recreate under the hood
 * (see apply_proposal's own docstring) since a Dean's own draft schedule
 * can't have its room/day/time updated in place — this drawer doesn't need
 * to know that; it only reads the per-item result apply_proposal returns.
 */
export function ScheduleAgentDrawer({
  open,
  onClose,
  target,
  workspace,
  departmentName,
  programGeneration,
}: ScheduleAgentDrawerProps) {
  // Only "Generate program" (its own picker always resolves a real
  // submission first) ever needs this -- a term-anchored conversation
  // never has a programGeneration request to act on.
  const submissionId = target.kind === "submission" ? target.submissionId : null;
  const targetKey = target.kind === "submission" ? `submission:${target.submissionId}` : `term:${target.syId}:${target.semesterNumber}`;
  const prefersReducedMotion = useReducedMotion();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [conversationList, setConversationList] = useState<ScheduleAgentConversationSummary[] | null>(null);
  const [conversationListLoading, setConversationListLoading] = useState(false);
  const [modelCatalog, setModelCatalog] = useState<ScheduleAgentModelCatalog | null>(null);
  const [modelCatalogLoading, setModelCatalogLoading] = useState(false);
  const [solverModel, setSolverModel] = useState("");
  const [reviewerModel, setReviewerModel] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [input, setInput] = useState("");
  const busy = exchanges.some((exchange) => exchange.status === "pending");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const handledProgramGenerationRef = useRef<string | null>(null);

  // On a fresh target (new submission/term, or the first open), pick up the
  // most recently active conversation automatically — "preserved by
  // default", same as reopening any chat app. Older threads are still
  // reachable via the History picker. Keyed to targetKey/workspace, not
  // `open`, so it doesn't refire (and wipe out messages just sent) on every
  // close/reopen of the same target.
  useEffect(() => {
    let cancelled = false;
    setLoadingConversation(true);
    setExchanges([]);
    setConversationId(null);
    setViewMode("chat");
    setConversationList(null);

    scheduleAgentService
      .getConversations(target, workspace)
      .then(async (list) => {
        if (cancelled) return;
        if (list.length === 0) return;
        const messages = await scheduleAgentService.getConversationMessages(list[0].conversationId);
        if (cancelled) return;
        setConversationId(list[0].conversationId);
        setExchanges(messages.map((item) => toExchange(item, list[0].conversationId)));
      })
      .catch((err) => {
        if (!cancelled) reportRequestError(err);
      })
      .finally(() => {
        if (!cancelled) setLoadingConversation(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetKey, workspace]);

  useEffect(() => {
    if (!open || modelCatalog) return;
    let cancelled = false;
    setModelCatalogLoading(true);
    scheduleAgentService
      .getModels()
      .then((catalog) => {
        if (cancelled) return;
        setModelCatalog(catalog);
        setSolverModel(catalog.defaultSolverModel);
        setReviewerModel(catalog.defaultReviewerModel);
      })
      .catch((err) => {
        if (!cancelled) reportRequestError(err);
      })
      .finally(() => {
        if (!cancelled) setModelCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, modelCatalog]);

  useEffect(() => {
    if (!modelPickerOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (modelPickerRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-slot="select-positioner"]')) return;
      setModelPickerOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [modelPickerOpen]);

  useEffect(() => {
    if (
      !open ||
      !programGeneration ||
      handledProgramGenerationRef.current === programGeneration.key ||
      loadingConversation ||
      modelCatalogLoading ||
      !modelCatalog ||
      busy
    ) {
      return;
    }
    handledProgramGenerationRef.current = programGeneration.key;
    void handleGenerateProgram(programGeneration);
  }, [busy, loadingConversation, modelCatalog, modelCatalogLoading, open, programGeneration]);

  // Grows the composer with its content, up to a cap, instead of a fixed
  // one-line box that scrolls a long request out of view as it's typed.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // Follows the newest message — a new exchange, streaming reasoning text,
  // or reopening the drawer on an existing conversation all scroll to the
  // bottom, same as any chat UI.
  useEffect(() => {
    if (!open || viewMode !== "chat") return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, viewMode, exchanges]);

  async function openHistoryPicker() {
    setViewMode("history");
    setConversationListLoading(true);
    try {
      setConversationList(await scheduleAgentService.getConversations(target, workspace));
    } catch (err) {
      reportRequestError(err);
    } finally {
      setConversationListLoading(false);
    }
  }

  async function pickConversation(id: string) {
    setLoadingConversation(true);
    setViewMode("chat");
    try {
      const messages = await scheduleAgentService.getConversationMessages(id);
      setConversationId(id);
      setExchanges(messages.map((item) => toExchange(item, id)));
    } catch (err) {
      reportRequestError(err);
    } finally {
      setLoadingConversation(false);
    }
  }

  function startNewConversation() {
    setViewMode("chat");
    setConversationId(null);
    setExchanges([]);
  }

  async function handleSend(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    const id = `${Date.now()}`;
    setInput("");
    setModelPickerOpen(false);
    setExchanges((prev) => [
      ...prev,
      {
        id,
        message: trimmed,
        status: "pending",
        phase: "reasoning",
        createdAt: new Date().toISOString(),
        reasoning: "",
      },
    ]);

    function update(patch: Partial<Exchange>) {
      setExchanges((prev) =>
        prev.map((exchange) => (exchange.id === id ? { ...exchange, ...patch } : exchange)),
      );
    }

    try {
      await scheduleAgentService.solveStream(
        target,
        workspace,
        trimmed,
        conversationId,
        {
          solverModel: solverModel || undefined,
          reviewerModel: reviewerModel || undefined,
        },
        {
          onReasoning: (delta) => {
            setExchanges((prev) =>
              prev.map((exchange) =>
                exchange.id === id
                  ? { ...exchange, reasoning: (exchange.reasoning ?? "") + delta }
                  : exchange,
              ),
            );
          },
          onDrafting: () => update({ phase: "drafting" }),
          onRevising: () => update({ phase: "revising" }),
          onReviewing: () => update({ phase: "reviewing" }),
          onDone: (result) => {
            update({ status: "done", result });
            setConversationId(result.conversationId);
          },
          onError: (message) => {
            toast.error(message);
            update({ status: "error", error: message });
          },
        },
      );
    } catch (err) {
      const errorMessage = reportRequestError(err);
      update({ status: "error", error: errorMessage });
    }
  }

  async function handleGenerateProgram(request: ScheduleAgentProgramGenerationRequest) {
    // Never actually null here -- the "Generate program" picker always
    // resolves a real submission before setting programGeneration -- this
    // guard is only so TypeScript accepts submissionId's now-nullable type.
    if (submissionId == null) return;
    const id = `program-${request.key}`;
    setViewMode("chat");
    setConversationId(null);
    setInput("");
    setModelPickerOpen(false);
    setExchanges([
      {
        id,
        kind: "program",
        message: `Generate complete program schedule for ${request.programLabel}`,
        status: "pending",
        phase: "reasoning",
        createdAt: new Date().toISOString(),
      },
    ]);

    function update(patch: Partial<Exchange>) {
      setExchanges((current) =>
        current.map((exchange) =>
          exchange.id === id ? { ...exchange, ...patch } : exchange,
        ),
      );
    }

    try {
      await scheduleAgentService.generateProgramStream(
        submissionId,
        workspace,
        request.programId,
        {
          solverModel: solverModel || undefined,
          reviewerModel: reviewerModel || undefined,
        },
        {
          onDrafting: () => update({ phase: "drafting" }),
          onRevising: () => update({ phase: "revising" }),
          onReviewing: () => update({ phase: "reviewing" }),
          onProgress: (progress) => update({ progress, phase: "drafting" }),
          onDone: (result) => {
            update({ status: "done", result });
            setConversationId(result.conversationId);
          },
          onError: (message) => {
            toast.error(message);
            update({ status: "error", error: message });
          },
        },
      );
    } catch (err) {
      const errorMessage = reportRequestError(err);
      update({ status: "error", error: errorMessage });
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Marvis Agent"
        description={
          `${workspace === "dean" ? "Dean" : "Registrar"} workspace` +
          (departmentName ? ` · ${departmentName}` : "")
        }
        wide
        disableBackdropBlur
        headerActions={
          <>
            <div ref={modelPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setModelPickerOpen((current) => !current)}
                aria-label="Choose Marvis Agent models"
                aria-expanded={modelPickerOpen}
                aria-controls="schedule-agent-model-picker"
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <span
                  className={`flex transition-transform duration-200 ease-out ${
                    modelPickerOpen ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <SettingsIcon />
                </span>
              </button>
              <AnimatePresence>
                {modelPickerOpen ? (
                  <motion.div
                    id="schedule-agent-model-picker"
                    role="group"
                    aria-label="Marvis Agent models"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-20 mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-surface-raised"
                  >
                    <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                      Models used for the next request
                    </p>
                    <AgentModelSelect
                      id="schedule-agent-solver-model"
                      label="Solver model"
                      models={modelCatalog?.models ?? []}
                      value={solverModel}
                      placeholder={modelCatalogLoading ? "Loading models…" : "Unavailable"}
                      disabled={busy || modelCatalogLoading || !modelCatalog}
                      onValueChange={setSolverModel}
                    />
                    <AgentModelSelect
                      id="schedule-agent-reviewer-model"
                      label="Reviewer model"
                      models={modelCatalog?.models ?? []}
                      value={reviewerModel}
                      placeholder={modelCatalogLoading ? "Loading models…" : "Unavailable"}
                      disabled={busy || modelCatalogLoading || !modelCatalog}
                      onValueChange={setReviewerModel}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            {viewMode === "chat" ? (
              <>
                <button
                  type="button"
                  onClick={() => void openHistoryPicker()}
                  aria-label="Conversation history"
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ClockIcon size={17} />
                </button>
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={exchanges.length === 0}
                  aria-label="New conversation"
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <PlusIcon />
                </button>
              </>
            ) : null}
          </>
        }
        footer={viewMode === "chat" ? (
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex items-end gap-1.5 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm transition-colors duration-150 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400 dark:border-white/15 dark:bg-white/5">
              <label htmlFor="schedule-agent-message" className="sr-only">
                Message to the Marvis Agent
              </label>
              <textarea
                ref={textareaRef}
                id="schedule-agent-message"
                rows={1}
                value={input}
                disabled={busy}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend(input);
                  }
                }}
                placeholder="Describe a conflict or ask a follow-up…"
                className="max-h-30 min-h-6 size-none border-0 bg-transparent px-2 py-1.5 font-body text-sm text-gray-900 outline-none placeholder-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-mist-100 dark:placeholder-slate-500"
              />
              <button
                type="button"
                aria-label="Send"
                disabled={busy || !input.trim()}
                onClick={() => void handleSend(input)}
                className="grid size-9 shrink-0 cursor-pointer place-items-center self-end rounded-xl bg-navy-800 text-white transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-white dark:text-navy-900 dark:disabled:bg-white/8 dark:disabled:text-slate-500"
              >
                <SendIcon size={15} />
              </button>
            </div>
            <p className="px-1 font-body text-[10.5px] text-slate-400 dark:text-slate-500">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        ) : undefined}
      >
        {viewMode === "history" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
              <div className="flex min-w-0 items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode("chat")}
                  aria-label="Back to chat"
                  title="Back to chat"
                  className="group grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-mist-100"
                >
                  <span className="flex transition-transform duration-150 group-hover:-translate-x-0.5">
                    <ArrowLeftIcon />
                  </span>
                </button>
                <div>
                  <h3 className={PORTAL_SECTION_TITLE}>Past conversations</h3>
                  <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                    Resume an earlier Marvis Agent thread.
                  </p>
                </div>
              </div>
              {conversationList && !conversationListLoading ? (
                <Badge tone="slate">
                  {conversationList.length} thread{conversationList.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>

            {conversationListLoading ? (
              <div className="flex flex-col gap-2" aria-label="Loading past conversations">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/3"
                  >
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-4/5" />
                      <Skeleton className="h-2.5 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationList && conversationList.length > 0 ? (
              <div className="flex flex-col gap-2">
                {conversationList.map((conversation) => {
                  const isCurrent = conversation.conversationId === conversationId;
                  return (
                    <button
                      key={conversation.conversationId}
                      type="button"
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => void pickConversation(conversation.conversationId)}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                        isCurrent
                          ? "border-gold-400 bg-gold-400/10 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-r-full before:bg-gold-500 before:content-[''] dark:bg-gold-400/8"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/3 dark:hover:border-white/15 dark:hover:bg-white/6"
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                          isCurrent
                            ? "bg-gold-400/20 text-gold-600 dark:text-gold-300"
                            : "bg-cream-100 text-navy-500 dark:bg-white/6 dark:text-gwc-blue-soft"
                        }`}
                      >
                        <SparkleIcon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 font-body text-sm font-semibold leading-snug text-navy-800 dark:text-mist-100">
                            {conversation.title}
                          </span>
                          {isCurrent ? <Badge tone="gold">Current</Badge> : null}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[10.5px] text-slate-500 dark:text-slate-400">
                          <span>
                            {conversation.messageCount} message
                            {conversation.messageCount === 1 ? "" : "s"}
                          </span>
                          <span aria-hidden="true" className="size-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span title={formatDateTime(conversation.lastActivityAt)}>
                            {formatRelativeTime(conversation.lastActivityAt)}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-navy-600 dark:text-slate-600 dark:group-hover:text-gwc-blue-soft">
                        <ChevronRightIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-xl bg-cream-100 text-navy-400 dark:bg-white/6 dark:text-gwc-blue-soft">
                  <ClockIcon size={20} />
                </span>
                <p className="mt-3 font-display text-lg tracking-[0.075em] text-navy-700 dark:text-mist-100">
                  No conversations yet
                </p>
                <p className="mt-1 max-w-xs font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Your Marvis Agent threads will appear here after you send your first message.
                </p>
                <Button type="button" block={false} className="mt-4" onClick={startNewConversation}>
                  Start a conversation
                </Button>
              </div>
            )}
          </div>
        ) : loadingConversation ? (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <Spinner />
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            Loading conversation…
          </span>
        </div>
      ) : exchanges.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
          <div className="relative mb-2 grid size-20 place-items-center" aria-hidden="true">
            {!prefersReducedMotion ? (
              <>
                <motion.span
                  initial={{ opacity: 0.45, scale: 0.72 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: "easeOut" }}
                  className="absolute size-14 rounded-2xl border border-gold-400/50 dark:border-gold-300/40"
                />
                <motion.span
                  initial={{ opacity: 0.3, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.32 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                  className="absolute size-14 rounded-2xl border border-gold-300/40 dark:border-gold-300/25"
                />
              </>
            ) : null}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.72, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.04 }}
              className="relative grid size-14 place-items-center overflow-hidden rounded-2xl border border-gold-300 bg-linear-to-br from-amber-100 via-white to-gold-100 text-gold-600 shadow-lg shadow-gold-500/15 dark:border-gold-400/30 dark:from-gold-400/18 dark:via-white/8 dark:to-navy-700/30 dark:text-gold-300 dark:shadow-black/20"
            >
              <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent dark:via-gold-200/70" />
              <motion.span
                className="flex"
                animate={prefersReducedMotion ? undefined : { rotate: [0, 7, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.65, delay: 0.28, ease: "easeInOut" }}
              >
                <SparkleIcon size={26} />
              </motion.span>
            </motion.div>
          </div>
          <motion.h3
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32, ease: "easeOut" }}
            className="font-display text-lg text-navy-700 dark:text-mist-100"
          >
            Ask Marvis
          </motion.h3>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            className="max-w-xs font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {workspace === "registrar"
              ? "Marvis sees schedules and conflicts across every department this term — describe what you need."
              : "Describe a scheduling conflict in this submission and get a proposed resolution."}
          </motion.p>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            {(workspace === "registrar"
              ? target.kind === "term"
                ? REGISTRAR_TERM_EXAMPLE_PROMPTS
                : REGISTRAR_EXAMPLE_PROMPTS
              : EXAMPLE_PROMPTS
            ).map((prompt, index) => (
              <motion.button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.48 + index * 0.08, ease: "easeOut" }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-xs text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:border-white/12 dark:bg-white/3 dark:text-slate-300 dark:hover:bg-white/6"
              >
                <span className="shrink-0 text-slate-400 dark:text-slate-500">
                  <SearchIcon size={14} />
                </span>
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-6">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="flex flex-col gap-3.5">
              <div className="flex max-w-[88%] flex-col items-end self-end">
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  {exchange.createdAt ? (
                    <span
                      title={formatDateTime(exchange.createdAt)}
                      className="font-body text-[10.5px] text-slate-400 dark:text-slate-500"
                    >
                      {formatRelativeTime(exchange.createdAt)}
                    </span>
                  ) : null}
                  <span className="font-body text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                    {exchange.kind === "program" ? "Program generation" : "You"}
                  </span>
                </div>
                <div className="rounded-2xl rounded-br-sm bg-gwc-blue px-4 py-3 text-white shadow-sm dark:bg-gwc-blue-deep">
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                    {exchange.message}
                  </p>
                </div>
              </div>

              {exchange.status === "pending" && (
                <Card className="border-slate-200 p-4 shadow-sm dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 dark:bg-gold-400/10">
                      <Spinner />
                    </span>
                    <div>
                      <p className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                        Marvis
                      </p>
                      <p className="mt-0.5 font-body text-[10.5px] text-slate-500 dark:text-slate-400">
                        {pendingStatusLabel(exchange)}
                      </p>
                    </div>
                  </div>
                  {exchange.kind === "program" && exchange.progress ? (
                    <div className="mt-3">
                      <div
                        role="progressbar"
                        aria-label="Program schedule generation progress"
                        aria-valuemin={0}
                        aria-valuemax={exchange.progress.total}
                        aria-valuenow={exchange.progress.index}
                        className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8"
                      >
                        <motion.div
                          className="h-full rounded-full bg-linear-to-r from-gold-400 to-amber-500 dark:from-gold-300 dark:to-gold-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              100,
                              (exchange.progress.index / Math.max(exchange.progress.total, 1)) * 100,
                            )}%`,
                          }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-3 font-body text-[10.5px] text-slate-400 dark:text-slate-500">
                        <span className="truncate">{exchange.progress.target}</span>
                        <span className="shrink-0">
                          {exchange.progress.index} / {exchange.progress.total} sets
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {exchange.phase === "reasoning" && exchange.reasoning && (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 font-body text-xs leading-relaxed whitespace-pre-wrap text-slate-500 dark:bg-white/4 dark:text-slate-400">
                      {exchange.reasoning}
                    </p>
                  )}
                </Card>
              )}

              {exchange.status === "error" && (
                <Card className="border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/8">
                  <p className="font-body text-xs text-red-700 dark:text-red-300">{exchange.error}</p>
                </Card>
              )}

              {exchange.status === "done" && exchange.result && (
                <SolutionCard
                  solution={exchange.result.solution}
                  proposalId={exchange.result.proposalId}
                  status={exchange.result.status}
                  createdAt={exchange.createdAt}
                />
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      </Drawer>

    </>
  );
}
