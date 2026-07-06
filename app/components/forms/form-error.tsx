/** Inline form-level error alert. Renders nothing when there is no message. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 font-body text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
    >
      {message}
    </div>
  );
}
