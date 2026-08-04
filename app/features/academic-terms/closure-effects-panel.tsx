import type { ReactNode } from "react";
import { CheckIcon, EyeIcon, LockIcon } from "~/components/ui/icons";

export type ClosureEffect = { label: string };

type ClosureEffectsPanelProps = {
  effects: ClosureEffect[];
  /** Compact layout for modals; default shows the full two-column panel. */
  variant?: "default" | "compact";
  className?: string;
};

function isAllowedEffect(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes("remain readable") ||
    lower.includes("still allowed") ||
    lower.includes("still work") ||
    lower.includes("views and reports")
  );
}

function partitionEffects(effects: ClosureEffect[]) {
  const restricted: ClosureEffect[] = [];
  const allowed: ClosureEffect[] = [];

  for (const effect of effects) {
    if (isAllowedEffect(effect.label)) {
      allowed.push(effect);
    } else {
      restricted.push(effect);
    }
  }

  return { restricted, allowed };
}

function EffectItem({
  label,
  tone,
}: {
  label: string;
  tone: "restricted" | "allowed";
}) {
  const isRestricted = tone === "restricted";

  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          isRestricted
            ? "bg-amber-100 text-amber-700 dark:bg-gold-400/15 dark:text-gold-300"
            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
        }`}
        aria-hidden="true"
      >
        {isRestricted ? <LockIcon size={11} /> : <CheckIcon size={11} strokeWidth={3} />}
      </span>
      <span className="font-body text-sm leading-snug text-slate-600 dark:text-slate-300">{label}</span>
    </li>
  );
}

function EffectGroup({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: ReactNode;
  tone: "restricted" | "allowed";
  items: ClosureEffect[];
}) {
  if (items.length === 0) return null;

  const borderTone =
    tone === "restricted"
      ? "border-amber-200/80 dark:border-gold-400/20"
      : "border-emerald-200/80 dark:border-emerald-400/20";
  const bgTone =
    tone === "restricted"
      ? "bg-amber-50/50 dark:bg-gold-400/5"
      : "bg-emerald-50/50 dark:bg-emerald-400/5";

  return (
    <div className={`rounded-lg border ${borderTone} ${bgTone} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`grid size-7 place-items-center rounded-md ${
            tone === "restricted"
              ? "bg-amber-100 text-amber-700 dark:bg-gold-400/15 dark:text-gold-300"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <h4 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">{title}</h4>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <EffectItem key={item.label} label={item.label} tone={tone} />
        ))}
      </ul>
    </div>
  );
}

/** Explains what posting a term locks and what stays available — driven by backend `closure_effects`. */
export function ClosureEffectsPanel({ effects, variant = "default", className = "" }: ClosureEffectsPanelProps) {
  if (effects.length === 0) return null;

  const { restricted, allowed } = partitionEffects(effects);

  if (variant === "compact") {
    return (
      <section className={className}>
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
          What happens when you post a term
        </h3>
        <ul className="mt-3 space-y-2">
          {effects.map((item) => (
            <EffectItem
              key={item.label}
              label={item.label}
              tone={isAllowedEffect(item.label) ? "allowed" : "restricted"}
            />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised ${className}`}
      aria-labelledby="closure-effects-heading"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-gold-400/25 dark:bg-gold-400/10 dark:text-gold-300">
          <LockIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id="closure-effects-heading"
            className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100"
          >
            What happens when you post a term
          </h3>
          <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
            Posting locks destructive changes for that semester. Views, reports, and exports stay available.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <EffectGroup
          title="Locked after posting"
          icon={<LockIcon size={14} />}
          tone="restricted"
          items={restricted}
        />
        <EffectGroup
          title="Still available"
          icon={<EyeIcon />}
          tone="allowed"
          items={allowed}
        />
      </div>
    </section>
  );
}
