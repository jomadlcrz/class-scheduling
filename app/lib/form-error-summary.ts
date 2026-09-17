import { toast } from "sonner";

/**
 * Standard error reporting for forms, dialogs, drawers, and mutations.
 *
 * One numbered list is shown in two places: an error-summary toast (title = how
 * many fields are wrong, description = the list) and the form's inline
 * `FormError` banner. Reporting every failure at once means the user never has
 * to submit repeatedly to discover the next problem, and the inline copy
 * survives the toast auto-dismissing while they fix fields.
 */


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
