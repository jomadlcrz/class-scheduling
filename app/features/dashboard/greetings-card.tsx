import { motion } from "motion/react";
import type { DashboardGreeting } from "~/services/dashboard.service";
import { Card } from "~/components/ui/card";
import { CalendarIcon, ClockIcon } from "~/components/ui/icons";
import { fadeUp } from "~/landing/motion";

type GreetingsCardProps = {
  greeting: DashboardGreeting;
};

/** Splits the backend's "%A, %B %d, %Y | %I:%M %p" string into its two halves
 *  so each can be styled on its own; falls back to the raw string untouched. */
function splitDateTime(dateTime: string) {
  const parts = dateTime.split("|").map((part) => part.trim());
  if (parts.length === 2 && parts[0] && parts[1]) return { date: parts[0], time: parts[1] };
  return { date: dateTime, time: null };
}

/**
 * A card that displays the user's personalised greeting, current date/time,
 * and a contextual message. Designed to sit at the top of the dashboard.
 */
export function GreetingsCard({ greeting }: GreetingsCardProps) {
  const { date, time } = splitDateTime(greeting.dateTime);

  return (
    <motion.div variants={fadeUp} className="mb-6">
      <Card className="relative overflow-hidden px-6 py-5">
        <div className="relative z-10">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-3xl tracking-wide text-navy-800 dark:text-mist-100">
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="inline-block origin-[70%_80%] text-2xl"
              >
                👋
              </motion.span>
              <span>{greeting.userName}</span>
            </h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {greeting.message}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon />
                <span className="uppercase tracking-wide">{date}</span>
              </span>
              {time && (
                <>
                  <span aria-hidden className="hidden h-3 w-px bg-slate-200 sm:block dark:bg-white/15" />
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <ClockIcon />
                    <span>{time}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}