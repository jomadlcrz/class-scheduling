import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { ClassSet } from "~/types/set";

type Kind = "rejected" | "unscheduled" | "draft" | "pending";

type ActionItem = {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  to: string;
  actionLabel: string;
};

const KIND_TONE: Record<Kind, BadgeTone> = {
  rejected: "red",
  unscheduled: "gold",
  draft: "slate",
  pending: "sky",
};

const KIND_LABEL: Record<Kind, string> = {
  rejected: "Returned",
  unscheduled: "Unscheduled",
  draft: "Draft",
  pending: "Pending",
};

const PRIORITY: Record<Kind, number> = { rejected: 0, unscheduled: 1, draft: 2, pending: 3 };

/** Full section label — program abbrev + year level + set code, e.g. "BSIT-4E". */
function sectionLabel(program: string | null, yearLevel: number | null, setCode: string | null): string {
  const raw = (setCode ?? "").trim();
  if (raw.includes("-")) return raw.toUpperCase(); // already a full set name
  const code = raw.toUpperCase();
  const prog = (program ?? "").trim();
  if (!prog && !code) return "";
  // Matches the backend set_name: `${program_abbrev}-${year_level}${set_code.upper()}`.
  return `${prog}-${yearLevel ?? ""}${code}`;
}

function releaseTitle(r: ScheduleRelease): string {
  return sectionLabel(r.programAbbrev, r.yearLevel, r.setCode) || `#${r.id}`;
}

/** Deep-links the generator with the section pre-selected (program → year → set). */
function schedulingNewPath(schoolYear: string, semester: number, set: ClassSet): string {
  const params = new URLSearchParams();
  if (schoolYear) params.set("sy", schoolYear);
  params.set("sem", String(semester));
  if (set.program) params.set("program", set.program);
  if (set.yearLevel != null) params.set("yl", String(set.yearLevel));
  const name = sectionLabel(set.program, set.yearLevel, set.setCode);
  if (name) params.set("set", name);
  return `/schedules/new?${params.toString()}`;
}

/** Deep-links Section Schedules with the release's section pre-selected (program → year → set). */
function regularClassPath(schoolYear: string, r: ScheduleRelease): string {
  const params = new URLSearchParams();
  if (schoolYear) params.set("sy", schoolYear);
  params.set("sem", String(r.semesterNumber));
  if (r.programAbbrev) params.set("program", r.programAbbrev);
  if (r.yearLevel != null) params.set("yl", String(r.yearLevel));
  const name = sectionLabel(r.programAbbrev, r.yearLevel, r.setCode);
  if (name) params.set("set", name);
  return `/schedules/regular-class?${params.toString()}`;
}

/** Most-urgent-first queue: rejected → unscheduled → drafts → pending. */
function buildQueue(
  releases: ScheduleRelease[],
  unscheduledSets: ClassSet[],
  schoolYear: string,
  semester: number,
): ActionItem[] {
  const items: ActionItem[] = [];

  for (const r of releases) {
    if (r.releaseStatus !== "rejected") continue;
    items.push({
      id: `rejected-${r.id}`,
      kind: "rejected",
      title: releaseTitle(r),
      detail: r.rejectionReason ? `Dean returned this — ${r.rejectionReason}` : "Dean returned this for changes.",
      to: regularClassPath(schoolYear, r),
      actionLabel: "Revise",
    });
  }
  for (const set of unscheduledSets) {
    items.push({
      id: `unscheduled-${set.id}`,
      kind: "unscheduled",
      title: sectionLabel(set.program, set.yearLevel, set.setCode),
      detail: "No timetable saved for this term yet.",
      to: schedulingNewPath(schoolYear, semester, set),
      actionLabel: "Generate",
    });
  }
  for (const r of releases) {
    if (r.releaseStatus !== "draft") continue;
    items.push({
      id: `draft-${r.id}`,
      kind: "draft",
      title: releaseTitle(r),
      detail: `${r.sessionCount} session${r.sessionCount === 1 ? "" : "s"} saved — submit to the dean when ready.`,
      to: regularClassPath(schoolYear, r),
      actionLabel: "Review",
    });
  }
  for (const r of releases) {
    if (r.releaseStatus !== "pending_approval") continue;
    items.push({
      id: `pending-${r.id}`,
      kind: "pending",
      title: releaseTitle(r),
      detail: "Waiting in the dean's review queue.",
      to: regularClassPath(schoolYear, r),
      actionLabel: "View",
    });
  }

  return items.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]);
}

const MAX_SHOWN = 8;

type Props = {
  releases: ScheduleRelease[];
  unscheduledSets: ClassSet[];
  /** Target term for the generator deep-link. */
  schoolYear: string;
  semester: number;
};

/** Specific sections needing the registrar's attention, pulled from the term's releases + unscheduled sets. */
export function HubActionQueue({ releases, unscheduledSets, schoolYear, semester }: Props) {
  const navigate = useNavigate();
  const items = useMemo(
    () => buildQueue(releases, unscheduledSets, schoolYear, semester),
    [releases, unscheduledSets, schoolYear, semester],
  );

  if (items.length === 0) {
    return (
      <Card className="p-4 sm:p-5">
        <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
          Needs your attention
        </h2>
        <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">
          Nothing waiting on you right now — every section is scheduled and moving through approval.
        </p>
      </Card>
    );
  }

  const shown = items.slice(0, MAX_SHOWN);

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
        Needs your attention
        <span className="ml-1.5 font-body text-sm font-normal text-slate-400 dark:text-slate-500">
          ({items.length})
        </span>
      </h2>
      <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-white/8">
        {shown.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <span className="flex items-center gap-2">
                <Badge tone={KIND_TONE[item.kind]}>{KIND_LABEL[item.kind]}</Badge>
                <span className="truncate font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {item.title}
                </span>
              </span>
              <span className="mt-0.5 block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                {item.detail}
              </span>
            </div>
            <Button type="button" variant="outline" block={false} onClick={() => navigate(item.to)}>
              {item.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
      {items.length > MAX_SHOWN && (
        <p className="mt-2 font-body text-xs text-slate-400 dark:text-slate-500">
          +{items.length - MAX_SHOWN} more — open Section Schedules to work through the rest.
        </p>
      )}
    </Card>
  );
}
