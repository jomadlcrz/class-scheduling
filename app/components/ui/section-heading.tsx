import type { ReactNode } from "react";

/** Partial-width slanted tab, matching the sidebar's brand blue. Pair with a Card below it. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="w-full sm:w-fit">
      <span
        className="block bg-gwc-blue py-1.5 pl-4 pr-8 font-display text-sm tracking-wide text-white"
        style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%)" }}
      >
        {children}
      </span>
    </h3>
  );
}
