import { Badge, type BadgeTone } from "../../components/ui/badge";
import { SCHEDULE_MODE_LABELS, type ScheduleMode } from "../../types/schedule";

const MODE_TONE: Record<ScheduleMode, BadgeTone> = {
  F2F: "sky",
  Online: "emerald",
};

/** Colored pill for a class delivery mode (F2F / Online / Hybrid). */
export function ModeBadge({ mode }: { mode: ScheduleMode }) {
  return <Badge tone={MODE_TONE[mode]}>{SCHEDULE_MODE_LABELS[mode]}</Badge>;
}
