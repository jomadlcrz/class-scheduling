import { toast } from "sonner";
import type { ZodError } from "zod";

/**
 * Standard error reporting for forms, dialogs, drawers, and mutations.
 *
 * One numbered list is shown in two places: an error-summary toast (title = how
 * many fields are wrong, description = the list) and the form's inline
 * `FormError` banner. Reporting every failure at once means the user never has
 * to submit repeatedly to discover the next problem, and the inline copy
 * survives the toast auto-dismissing while they fix fields.
 */

/** "3 fields need attention" — the toast title and the banner's first line. */
export function issueCountLabel(count: number): string {
  return count === 1 ? "1 field needs attention" : `${count} fields need attention`;
}

/** "1. …\n2. …" — a single message is left unnumbered, since "1." alone adds noise. */
export function formatNumberedIssues(messages: string[]): string {
  if (messages.length === 1) return messages[0];
  return messages.map((message, index) => `${index + 1}. ${message}`).join("\n");
}

/** Numbered summary for the inline `FormError` banner. */
export function formatIssueSummary(messages: string[]): string {
  if (messages.length === 0) return "";
  if (messages.length === 1) return messages[0];
  return `${issueCountLabel(messages.length)}:\n${formatNumberedIssues(messages)}`;
}

/** Drop duplicate messages while preserving the order they were reported in. */
function dedupe(messages: string[]): string[] {
  const seen = new Set<string>();
  return messages.filter((message) => {
    const key = message.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Show validation failures as an error-summary toast and via `setError`.
 * Returns true when there was at least one issue, so callers can `return` early:
 *
 * ```ts
 * if (reportFormIssues(issues, setError)) return;
 * ```
 */
export function reportFormIssues(
  messages: string[],
  setError?: (message: string | null) => void,
): boolean {
  const issues = dedupe(messages);
  if (issues.length === 0) {
    setError?.(null);
    return false;
  }

  setError?.(formatIssueSummary(issues));

  if (issues.length === 1) {
    toast.error(issues[0]);
  } else {
    toast.error(issueCountLabel(issues.length), {
      description: formatNumberedIssues(issues),
    });
  }
  return true;
}

/** Every message from a failed `safeParse`, in field order. */
export function zodIssueMessages(error: ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/** `reportFormIssues` for a failed Zod `safeParse`. */
export function reportZodIssues(
  error: ZodError,
  setError?: (message: string | null) => void,
): boolean {
  return reportFormIssues(zodIssueMessages(error), setError);
}

/**
 * Report a failed request (or any thrown value) the same way: inline banner plus
 * a toast, so a failure never hides above the fold on a long form.
 */
export function reportRequestError(
  err: unknown,
  setError?: (message: string | null) => void,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = (err instanceof Error ? err.message : "").trim() || fallback;
  setError?.(message);
  toast.error(message);
  return message;
}
