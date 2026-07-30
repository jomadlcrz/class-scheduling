import { motion } from "motion/react";

const shimmerSlide = {
  initial: { x: "-100%" },
  animate: { x: "200%", transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const } },
};

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-200 dark:bg-white/8 ${className ?? ""}`}>
      <motion.div
        variants={shimmerSlide}
        initial="initial"
        animate="animate"
        className="absolute inset-y-0 w-full"
        style={{
          background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
        }}
      />
    </div>
  );
}
