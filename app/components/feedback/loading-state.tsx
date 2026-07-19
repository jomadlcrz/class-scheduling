import { Spinner } from "~/components/ui/spinner";

/** Full-viewport centered spinner, shown while auth/session state resolves. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid min-h-dvh place-items-center bg-cream-50 text-navy-700 dark:bg-surface dark:text-slate-200"
    >
      <Spinner />
    </div>
  );
}
