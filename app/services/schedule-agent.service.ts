import { apiGet, apiPost, apiPostStream, type SseEvent } from "~/lib/api";
import type {
  ScheduleAgentApplyResult,
  ScheduleAgentConversationSummary,
  ScheduleAgentHistoryItem,
  ScheduleAgentModelCatalog,
  ScheduleAgentProgramProgress,
  ScheduleAgentResult,
  ScheduleAgentSubmissionOption,
  ScheduleAgentTarget,
  ScheduleAgentWorkspace,
} from "~/types/schedule-agent";

/** The /schedule-agent/submissions/<id>/proposals or /schedule-agent/term/<syId>/<semesterNumber>/proposals path. */
function getTargetProposalsPath(target: ScheduleAgentTarget, workspace: ScheduleAgentWorkspace): string {
  const query = `?workspace=${encodeURIComponent(workspace)}`;
  return target.kind === "submission"
    ? `/schedule-agent/submissions/${target.submissionId}/proposals${query}`
    : `/schedule-agent/term/${target.syId}/${target.semesterNumber}/proposals${query}`;
}

/** The /schedule-agent/submissions/<id>/conversations or /schedule-agent/term/<syId>/<semesterNumber>/conversations path. */
function getTargetConversationsPath(target: ScheduleAgentTarget, workspace: ScheduleAgentWorkspace): string {
  const query = `?workspace=${encodeURIComponent(workspace)}`;
  return target.kind === "submission"
    ? `/schedule-agent/submissions/${target.submissionId}/conversations${query}`
    : `/schedule-agent/term/${target.syId}/${target.semesterNumber}/conversations${query}`;
}

/** The /schedule-agent/submissions/<id>/solve or /schedule-agent/term/<syId>/<semesterNumber>/solve path. */
function getTargetSolvePath(target: ScheduleAgentTarget): string {
  return target.kind === "submission"
    ? `/schedule-agent/submissions/${target.submissionId}/solve`
    : `/schedule-agent/term/${target.syId}/${target.semesterNumber}/solve`;
}

type SolveStreamHandlers = {
  /** A chunk of the Solver Agent's own live reasoning text. */
  onReasoning?: (delta: string) => void;
  /** Reasoning finished; it's now generating the actual proposal. */
  onDrafting?: () => void;
  /** A real conflict was found in the drafted proposal; one silent
   * self-correction pass is running before "done" — a separate model
   * call, not instant. */
  onRevising?: () => void;
  /** Proposal generated; the (silent) Reviewer Agent is now critiquing it
   * before "done" comes back — a separate model call, not instant. */
  onReviewing?: () => void;
  onProgress?: (progress: ScheduleAgentProgramProgress) => void;
  onDone: (result: ScheduleAgentResult) => void;
  /** A failure mid-stream, after the connection already succeeded. */
  onError: (message: string) => void;
};

function handleAgentStreamEvent(event: SseEvent, handlers: SolveStreamHandlers): void {
  if (event.event === "reasoning") {
    const delta = (event.data as { delta?: string }).delta;
    if (delta) handlers.onReasoning?.(delta);
  } else if (event.event === "status") {
    const phase = (event.data as { phase?: string }).phase;
    if (phase === "drafting") handlers.onDrafting?.();
    else if (phase === "revising") handlers.onRevising?.();
    else if (phase === "reviewing") handlers.onReviewing?.();
  } else if (event.event === "progress") {
    handlers.onProgress?.(event.data as ScheduleAgentProgramProgress);
  } else if (event.event === "done") {
    handlers.onDone(event.data as ScheduleAgentResult);
  } else if (event.event === "error") {
    const message = (event.data as { message?: string }).message;
    handlers.onError(message ?? "Something went wrong. Please try again.");
  }
}

/** May itself reject (network/auth failure before the stream even starts) —
 * callers should still wrap the call in try/catch alongside onError.
 * conversationId: pass an existing one to resume that thread; null starts
 * a new one (its id comes back in onDone's result). */
async function solveStream(
  target: ScheduleAgentTarget,
  workspace: ScheduleAgentWorkspace,
  message: string,
  conversationId: string | null,
  modelSelection: { solverModel?: string; reviewerModel?: string },
  handlers: SolveStreamHandlers,
): Promise<void> {
  await apiPostStream(
    getTargetSolvePath(target),
    { workspace, message, conversationId, ...modelSelection },
    (event) => handleAgentStreamEvent(event, handlers),
  );
}

/** Generates every target set in one program while streaming per-set progress. */
async function generateProgramStream(
  submissionId: number,
  workspace: ScheduleAgentWorkspace,
  programId: number,
  modelSelection: { solverModel?: string; reviewerModel?: string },
  handlers: SolveStreamHandlers,
): Promise<void> {
  await apiPostStream(
    `/schedule-agent/submissions/${submissionId}/generate-program`,
    { workspace, programId, ...modelSelection },
    (event) => handleAgentStreamEvent(event, handlers),
  );
}

/** Backend-supported models and the independent defaults for each agent role. */
async function getModels(): Promise<ScheduleAgentModelCatalog> {
  return apiGet<ScheduleAgentModelCatalog>("/schedule-agent/models");
}

/** Every submission the signed-in user may target, including drafts. */
async function getSubmissions(): Promise<ScheduleAgentSubmissionOption[]> {
  const result = await apiGet<{ submissions: ScheduleAgentSubmissionOption[] }>(
    "/schedule-agent/submissions",
  );
  return result.submissions;
}

/** Creates the real schedule rows for a proposal's CREATE meetings. */
async function applyProposal(proposalId: number): Promise<ScheduleAgentApplyResult> {
  return apiPost<{ message: string } & ScheduleAgentApplyResult>(
    `/schedule-agent/proposals/${proposalId}/apply`,
  );
}

/** Past Schedule Agent proposals for one submission or term. */
async function getProposals(
  target: ScheduleAgentTarget,
  workspace: ScheduleAgentWorkspace,
): Promise<ScheduleAgentHistoryItem[]> {
  const result = await apiGet<{ proposals: ScheduleAgentHistoryItem[] }>(
    getTargetProposalsPath(target, workspace),
  );
  return result.proposals;
}

/** Resumable threads for one submission's or term's workspace, most recently active
 * first — the "pick a past conversation" history list. */
async function getConversations(
  target: ScheduleAgentTarget,
  workspace: ScheduleAgentWorkspace,
): Promise<ScheduleAgentConversationSummary[]> {
  const result = await apiGet<{ conversations: ScheduleAgentConversationSummary[] }>(
    getTargetConversationsPath(target, workspace),
  );
  return result.conversations;
}

/** One thread's turns in order — loaded when picking up a conversation to resume it. */
async function getConversationMessages(conversationId: string): Promise<ScheduleAgentHistoryItem[]> {
  const result = await apiGet<{ messages: ScheduleAgentHistoryItem[] }>(
    `/schedule-agent/conversations/${conversationId}/messages`,
  );
  return result.messages;
}

export const scheduleAgentService = {
  solveStream,
  generateProgramStream,
  getModels,
  getSubmissions,
  applyProposal,
  getProposals,
  getConversations,
  getConversationMessages,
};
