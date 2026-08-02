import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import type { CalendarStatus, ClosedReason, TermStatus } from "~/features/academic-terms/mock-data";

export function calendarStatusTone(status: CalendarStatus | string | null | undefined): BadgeTone {
  switch (status) {
    case "Ongoing":
      return "emerald";
    case "Ended":
      return "slate";
    case "Upcoming":
      return "sky";
    default:
      return "slate";
  }
}

export function termStatusTone(status: TermStatus): BadgeTone {
  return status === "Open" ? "emerald" : "gold";
}

export function closedReasonTone(reason: ClosedReason): BadgeTone {
  if (!reason) return "slate";
  if (reason === "School Year Ended") return "slate";
  return "gold";
}

export function StatusBadge({
  tone,
  children,
  icon,
}: {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Badge tone={tone}>
      <span className="inline-flex items-center gap-1">
        {icon}
        {children}
      </span>
    </Badge>
  );
}
