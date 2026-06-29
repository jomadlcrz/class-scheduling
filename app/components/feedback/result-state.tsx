import type { ReactNode } from "react";
import { ButtonLink } from "../ui/button";
import { AlertIcon, CheckIcon } from "../ui/icons";

const tones = {
  success: {
    circle:
      "border-green-200 bg-[#dcfce7] dark:border-emerald-400/20 dark:bg-emerald-400/10",
    icon: <CheckIcon />,
    iconColor: "text-[#136f3b] dark:text-emerald-400",
  },
  error: {
    circle: "border-red-200 bg-[#fee2e2] dark:border-red-400/20 dark:bg-red-400/10",
    icon: <AlertIcon />,
    iconColor: "text-[#9b1c1c] dark:text-red-400",
  },
} as const;

type ResultStateProps = {
  tone: keyof typeof tones;
  title: string;
  /** Body text under the title. */
  children: ReactNode;
  /** Optional call-to-action link rendered as a primary button. */
  action?: { href: string; label: string };
};

/** Centered terminal state for a flow: icon-in-circle, title, body, optional CTA. */
export function ResultState({ tone, title, children, action }: ResultStateProps) {
  const t = tones[tone];

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-full border ${t.circle}`}
      >
        <span className={t.iconColor}>{t.icon}</span>
      </div>
      <h2 className="font-display text-2xl tracking-wide text-[#111827] dark:text-white">
        {title}
      </h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#52637a] dark:text-slate-400">
        {children}
      </p>
      {action && (
        <ButtonLink href={action.href} className="mt-6">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
