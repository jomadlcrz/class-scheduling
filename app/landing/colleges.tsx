import { motion } from "motion/react";
import { fadeUp, inViewSection } from "./motion";

interface College {
  code: string;
  name: string;
  logo: string;
}

const COLLEGES: readonly College[] = [
  { code: "CITE", name: "College of Information Technology Education", logo: "/images/departments/cite.avif" },
  { code: "CBA", name: "College of Business Administration", logo: "/images/departments/cba.avif" },
  { code: "COC", name: "College of Criminology", logo: "/images/departments/coc.avif" },
  { code: "COED", name: "College of Education", logo: "/images/departments/coed.avif" },
];

/** Social proof: the four colleges the scheduler is built for. */
export function Colleges() {
  return (
    <section id="colleges" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div {...inViewSection}>
        <motion.p
          variants={fadeUp}
          className="text-center text-xs font-medium uppercase tracking-[0.3em] text-gold-600 dark:text-gold-300"
        >
          Built for every college
        </motion.p>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {COLLEGES.map((college) => (
            <motion.div
              key={college.code}
              variants={fadeUp}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-6 text-center backdrop-blur transition-colors duration-200 hover:border-gold-400/60 dark:border-white/10 dark:bg-white/4 dark:hover:border-gold-400/40"
            >
              <span className="grid size-16 place-items-center">
                <img
                  src={college.logo}
                  alt={`${college.code} logo`}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-full object-contain transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-110"
                />
              </span>
              <span className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
                {college.code}
              </span>
              <span className="text-[0.7rem] leading-snug text-slate-500 dark:text-slate-400">
                {college.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
