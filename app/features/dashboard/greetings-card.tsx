import { motion } from "motion/react";
import type { DashboardGreeting } from "~/services/dashboard.service";
import { Card } from "~/components/ui/card";
import { fadeUp } from "~/landing/motion";

type GreetingsCardProps = {
  greeting: DashboardGreeting;
};

/**
 * A card that displays the user's personalised greeting, current date/time,
 * and a contextual message. Designed to sit at the top of the dashboard.
 */
export function GreetingsCard({ greeting }: GreetingsCardProps) {
  return (
    <motion.div variants={fadeUp} className="mb-6">
      <Card className="relative overflow-hidden px-6 py-5">
        <div className="relative z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-mist-100">
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="inline-block origin-[70%_80%]"
              >
                👋
              </motion.span>{" "}
              {greeting.userName}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {greeting.dateTime}
            </p>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {greeting.message}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}