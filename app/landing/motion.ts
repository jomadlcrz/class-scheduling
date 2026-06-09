import type { Variants } from "motion/react";

/**
 * Shared motion variants. Entering uses ease-out, exiting ease-in (never linear),
 * and we keep one orchestrated reveal per viewport rather than animating every child.
 */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Stagger container for the hero's one-time load reveal. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

/** Fade + rise — the default child reveal. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/** Scale-in used by the schedule blocks once the card has settled. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

/** Standard "reveal once on scroll" props for below-the-fold sections. */
export const inViewSection = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.3 },
  variants: staggerContainer,
} as const;
