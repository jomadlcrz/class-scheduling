import { motion } from "motion/react";
import { fadeUp, inViewSection } from "./motion";
import type { ReactNode } from "react";

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

const FEATURES: readonly Feature[] = [
  {
    title: "Conflict detection",
    description:
      "Overlapping rooms, double-booked faculty, and student clashes surface instantly — before publishing.",
    icon: (
      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ),
  },
  {
    title: "Drag-to-schedule",
    description:
      "Build a week visually. Drop a section onto the grid and the timetable rebalances around it.",
    icon: (
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    ),
  },
  {
    title: "Instant publishing",
    description:
      "Share a finalized plan across every college with one click — always current, never a stale PDF.",
    icon: (
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    ),
  },
];

/** Three value cards explaining what the product does. */
export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div {...inViewSection}>
        <motion.h2
          variants={fadeUp}
          className="text-center font-display text-5xl tracking-wide text-navy-700 dark:text-white sm:text-6xl"
        >
          Everything a registrar needs
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-4 max-w-xl text-center text-slate-600 dark:text-slate-300"
        >
          Purpose-built for academic scheduling — from the first draft to the published term.
        </motion.p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              className="group rounded-2xl border border-slate-200 bg-white/90 p-7 transition-colors duration-200 hover:border-gold-400/60 dark:border-white/10 dark:bg-navy-900/80 dark:hover:border-gold-400/40"
            >
              <span className="inline-grid size-12 place-items-center rounded-xl bg-gold-400/15 text-navy-600 dark:text-gold-300">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {feature.icon}
                </svg>
              </span>
              <h3 className="mt-5 font-display text-2xl tracking-wide text-navy-700 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
