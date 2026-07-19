import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { fadeUp, inViewSection } from "~/landing/motion";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: readonly Stat[] = [
  { value: 4, label: "Colleges supported" },
  { value: 60, suffix: "+", label: "Rooms managed" },
  { value: 0, label: "Scheduling conflicts" },
  { value: 100, suffix: "%", label: "Clash-checked" },
];

/** Trust band: headline metrics that animate up as they enter the viewport. */
export function Stats() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <motion.dl
        {...inViewSection}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-white/10 md:grid-cols-4"
      >
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="flex flex-col items-center gap-1 bg-cream-50/98 px-6 py-9 text-center dark:bg-surface-raised/95"
          >
            <dd className="font-display text-5xl tracking-wide text-navy-700 dark:text-mist-100 sm:text-6xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </dd>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {stat.label}
            </dt>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
}

/** Animates a number from 0 to `value` once it scrolls into view. */
function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toString());

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 1.4, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, reduceMotion, value, count]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
