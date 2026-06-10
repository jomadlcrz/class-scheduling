import { motion } from "motion/react";
import { fadeUp, inViewSection } from "./motion";

/** Closing call-to-action band. */
export function Cta() {
  return (
    <section id="get-started" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        {...inViewSection}
        className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-linear-to-br from-navy-500/12 to-gold-400/8 px-6 py-16 text-center sm:px-12"
      >
        {/* Subtle glow accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)" }}
        />
        <motion.h2
          variants={fadeUp}
          className="relative font-display text-5xl tracking-wide text-navy-700 dark:text-white sm:text-6xl"
        >
          Plan the term in an afternoon
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="relative mx-auto mt-4 max-w-lg text-slate-600 dark:text-slate-300"
        >
          Bring your rooms, faculty, and sections. Walk out with a published,
          conflict-free schedule the whole campus can trust.
        </motion.p>
        <motion.div variants={fadeUp} className="relative mt-8">
          <a
            href="#top"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold-400 px-8 text-sm font-semibold text-navy-900 shadow-lg shadow-gold-400/30 transition-colors duration-200 hover:bg-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-navy-950"
          >
            Get started for free
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
