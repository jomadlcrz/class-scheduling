import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const FLAG_KEY = "cs-just-logged-in";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Call right before navigating to /dashboard on a successful login. */
export function markJustLoggedIn() {
  try {
    sessionStorage.setItem(FLAG_KEY, "1");
  } catch {
    // storage unavailable
  }
}

/** Reads and immediately clears the flag, so the intro plays exactly once per login. */
export function useJustLoggedIn() {
  const [justLoggedIn] = useState(() => {
    try {
      const flagged = sessionStorage.getItem(FLAG_KEY) === "1";
      if (flagged) sessionStorage.removeItem(FLAG_KEY);
      return flagged;
    } catch {
      return false;
    }
  });
  return justLoggedIn;
}

/**
 * Plays once, directly after login: the blueprint-grid timetable texture and
 * the auth screens' gold glow bloom in, then lift to reveal the dashboard —
 * so the handoff reads as one continuous scene rather than a hard cut.
 */
export function DashboardIntroOverlay() {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), reduceMotion ? 150 : 650);
    return () => clearTimeout(timeout);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-cream-50 dark:bg-navy-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.15 : 0.45, ease: EASE_OUT } }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 blueprint-grid text-navy-800 dark:text-gold-400"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.08 }}
            animate={{ opacity: 0.16, scale: 1, transition: { duration: reduceMotion ? 0.15 : 0.7, ease: EASE_OUT } }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 size-160 -translate-x-1/2 -translate-y-1/2"
            style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.28, scale: 1.2, transition: { duration: reduceMotion ? 0.15 : 0.7, ease: EASE_OUT } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
