import type { ReactNode } from "react";

type TextButtonProps = {
  children: ReactNode;
  onClick: () => void;
  type?: "button" | "submit";
};

/** Text-only action styled like a link (e.g. “+ Add New Subject”). */
export function TextButton({ children, onClick, type = "button" }: TextButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="cursor-pointer font-body text-sm font-semibold text-navy-700 transition-colors hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-gold-400 dark:hover:text-gold-300"
    >
      {children}
    </button>
  );
}
