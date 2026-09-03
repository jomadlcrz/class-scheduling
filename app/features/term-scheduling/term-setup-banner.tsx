import { useEffect, useState } from "react";
import { Alert, AlertAction, AlertDescription } from "~/components/ui/alert";
import { ButtonLink } from "~/components/ui/button";
import { termSchedulingService } from "~/services/term-scheduling.service";

/**
 * Reminds the Registrar when the term running right now has never been
 * configured — Major Scheduling and the Shift Request both start closed for
 * every new term (see TermSchedulingCalendar.governed), and nothing else
 * surfaces that fact once the "just created this school year" prompt on the
 * School Years page has been dismissed or missed entirely.
 *
 * Renders nothing once the term is governed, or while there is nothing to
 * report yet — this is a nudge, not a loading state.
 */
export function TermSetupBanner() {
  const [calendar, setCalendar] = useState<{ governed: boolean; termLabel: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void termSchedulingService
      .getCurrentCalendar()
      .then((cal) => {
        if (!cancelled) setCalendar({ governed: cal.governed, termLabel: cal.termLabel });
      })
      .catch(() => {
        // No calendar exists yet — treat as ungoverned
        if (!cancelled) setCalendar({ governed: false, termLabel: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !calendar || calendar.governed) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertDescription>
        {calendar.termLabel ?? "The current term"} has not been set up yet — Major Scheduling and
        the Shift Request both start closed until you configure it.
      </AlertDescription>
      <AlertAction>
        <ButtonLink href="/schedules/term-calendar" className="w-auto! px-4">
          Set up scheduling calendar
        </ButtonLink>
      </AlertAction>
    </Alert>
  );
}
