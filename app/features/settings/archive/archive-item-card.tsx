import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import {
  BookIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  KeyIcon,
  LayersIcon,
  RotateIcon,
  UsersIcon,
  UsersRoundIcon,
} from "~/components/ui/icons";
import { ArchiveExpandPanel } from "~/features/settings/archive/archive-expand-panel";
import { archiveSummaryBadges, formatArchivedRelative } from "~/features/settings/archive/utils";
import type { ArchiveItem } from "~/services/archive.service";
import type { ArchiveEntityType } from "~/services/archive.service";

const restoreButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 font-body text-xs font-medium text-green-700 transition-colors duration-150 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-green-400/30 dark:text-green-300 dark:hover:bg-green-400/10";

const archivedBadgeClassName =
  "inline-flex items-center rounded-full border border-orange-200 px-2 py-0.5 font-body text-xs font-medium text-orange-500 dark:border-orange-400/30 dark:text-orange-300";

const entityIcons: Partial<Record<ArchiveEntityType, typeof Building2Icon>> = {
  building: Building2Icon,
  room: LayersIcon,
  department: Building2Icon,
  program: GraduationCapIcon,
  set: UsersRoundIcon,
  subject: BookIcon,
  student: UsersIcon,
  school_year: CalendarIcon,
  semester: CalendarClockIcon,
  permission: KeyIcon,
};

type ArchiveItemCardProps = {
  item: ArchiveItem;
  onRestore: (item: ArchiveItem) => void;
};

export function ArchiveItemCard({ item, onRestore }: ArchiveItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const EntityIcon = entityIcons[item.entityType] ?? Building2Icon;
  const summaryBadges = archiveSummaryBadges(item);
  const canExpand = item.hasChildren;

  return (
    <Card className="px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
          <EntityIcon />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">{item.label}</p>
              <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                {formatArchivedRelative(item.archivedAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={archivedBadgeClassName}>Archived</span>
                {summaryBadges.map((badge) => (
                  <Badge key={badge} tone="slate">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onRestore(item)}
                aria-label={`Restore ${item.label}`}
                className={restoreButtonClassName}
              >
                <RotateIcon size={14} />
                Restore
              </button>
              {canExpand ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-label={expanded ? "Collapse archive details" : "Expand archive details"}
                  onClick={() => setExpanded((current) => !current)}
                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                >
                  {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </button>
              ) : null}
            </div>
          </div>

          {expanded && canExpand ? (
            <ArchiveExpandPanel entityType={item.entityType} entityId={item.entityId} />
          ) : null}
        </div>
      </div>
    </Card>
  );
}
