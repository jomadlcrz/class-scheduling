import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CalendarCheckIcon, CalendarIcon, CheckIcon, ChevronRightIcon, ClockIcon } from "~/components/ui/icons";
import type { HubStage, HubTone } from "~/features/schedules/hub/scheduling-stages";

const TONE_ACCENT: Record<HubTone, string> = {
  action: "border-gold-300 bg-amber-50 dark:border-gold-400/40 dark:bg-gold-400/10",
  wait: "border-sky-300 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-400/10",
  done: "border-emerald-300 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-400/10",
  info: "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5",
};

const TONE_ICON: Record<HubTone, ReactNode> = {
  action: <CalendarCheckIcon />,
  wait: <ClockIcon />,
  done: <CheckIcon size={22} />,
  info: <CalendarIcon />,
};

/** Dominant "do this next" card. Tone accent carries the workflow state (no decorative color). */
export function HubNextStepCard({ stage }: { stage: HubStage }) {
  const navigate = useNavigate();
  return (
    <Card className={`border-2 p-5 sm:p-6 ${TONE_ACCENT[stage.tone]}`}>
      <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {stage.eyebrow}
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-navy-700 shadow-sm dark:bg-white/10 dark:text-mist-100">
            {TONE_ICON[stage.tone]}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
              {stage.title}
            </h2>
            <p className="mt-1 font-body text-sm text-slate-600 dark:text-slate-300">{stage.line}</p>
          </div>
        </div>
        {stage.to && stage.actionLabel && (
          <div className="shrink-0">
            <Button
              type="button"
              variant={stage.tone === "wait" ? "outline" : "primary"}
              block={false}
              onClick={() => navigate(stage.to)}
            >
              {stage.actionLabel}
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
