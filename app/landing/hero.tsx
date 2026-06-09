import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "./motion";
import { ScheduleCard } from "./schedule-card";

/** Hero: the brand promise on the left, the live schedule card on the right. */
export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-32 lg:pt-20">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="text-center lg:text-left"
      >
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-navy-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <span className="size-1.5 rounded-full bg-gold-400" />
          Gateways Western College
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="mt-6 font-display text-6xl leading-[0.95] tracking-wide text-navy-700 dark:text-white sm:text-7xl lg:text-8xl"
        >
          Conflict-free
          <br />
          timetables,
          <span className="text-gold-600 dark:text-gold-400"> in minutes.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0 lg:text-lg"
        >
          GWC Class Scheduling turns rooms, faculty, and sections into a clean
          weekly plan — detecting clashes before they reach a single student.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
        >
          <a
            href="#get-started"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold-400 px-7 text-sm font-semibold text-navy-900 shadow-lg shadow-gold-400/30 transition-colors duration-200 hover:bg-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-navy-950 sm:w-auto"
          >
            Get started
          </a>
          <a
            href="#features"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-navy-300/60 px-7 text-sm font-semibold text-navy-700 transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-white dark:hover:bg-white/5 sm:w-auto"
          >
            See how it works
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex justify-center lg:justify-end"
      >
        <ScheduleCard />
      </motion.div>
    </section>
  );
}
