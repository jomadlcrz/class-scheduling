import { useMemo } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { InfoCircleIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip } from "~/components/ui/tooltip";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { useCachedData } from "~/hooks/use-cached-data";
import { deanService } from "~/services/dean.service";
import type {
  OfferingCoverage,
  OfferingCoverageDepartment,
  OfferingCoverageProgram,
} from "~/types/offering-coverage";

export type CoverageDrillTarget = {
  id: number;
  name: string;
  abbrev: string;
};

type OfferingCoverageOverviewProps = {
  syId: number | null;
  semesterNumber: number | null;
  /** Open one department's scoped assign view (Level 2). */
  onDrillIn?: (target: CoverageDrillTarget) => void;
};

const COVERAGE_NOTE =
  "Non-major subjects are shared across programs. Once one is assigned to an instructor in any program, it counts as covered for every curriculum carrying it, even when the instructor belongs to another department. Major subjects are excluded because they are assigned by the Dean.";

function ProgramCoverageRow({ program }: { program: OfferingCoverageProgram }) {
  const shown = program.subjects.filter((subject) => !subject.assigned);

  return (
    <div className="rounded-lg bg-slate-50/70 px-3 py-2.5 dark:bg-white/5">
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            {program.program_abbrev}
          </span>
          <span className="min-w-0 truncate font-body text-xs text-slate-500 dark:text-slate-400">
            {program.program_name}
          </span>
        </span>
      </div>
      {shown.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {shown.map((subject) => (
            <li
              key={subject.curriculum_detail_id}
              className="rounded-lg bg-amber-50/70 px-3 py-2.5 dark:bg-amber-400/[0.07]"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="font-body text-sm font-semibold leading-tight tabular-nums text-navy-800 dark:text-mist-100">
                    {subject.subject_code}
                  </span>
                  {subject.subject_type ? <SubjectTypeBadge type={subject.subject_type} /> : null}
                </span>
                <span className="mt-0.5 block min-w-0 truncate font-body text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                  {subject.descriptive_title}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DepartmentAccordionItem({
  department,
  onDrillIn,
}: {
  department: OfferingCoverageDepartment;
  onDrillIn?: (target: CoverageDrillTarget) => void;
}) {
  const coveredThisTerm = useMemo(() => {
    const status = new Map<number, boolean>();
    for (const program of department.programs) {
      for (const subject of program.subjects) {
        status.set(subject.subject_id, subject.assigned);
      }
    }
    const unassigned = [...status.values()].filter((assigned) => !assigned).length;
    return { total: status.size, unassigned };
  }, [department.programs]);

  return (
    <AccordionItem
      title={
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-base tracking-widest text-navy-700 dark:text-mist-100">
              {department.department_abbrev}
            </span>
            <span className="min-w-0 truncate font-body text-xs text-slate-500 dark:text-slate-400">
              {department.department_name}
            </span>
          </span>
          <span className="mt-0.5 font-body text-xs text-slate-400 dark:text-slate-500">
            {coveredThisTerm.total} minor{semNumberLabel(coveredThisTerm.total)} offered
          </span>
        </span>
      }
      adornment={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={coveredThisTerm.unassigned > 0 ? "gold" : "green"}>
            {coveredThisTerm.unassigned > 0
              ? `${coveredThisTerm.unassigned} unassigned`
              : "fully covered"}
          </Badge>
          {onDrillIn && (
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() =>
                onDrillIn({
                  id: department.department_id,
                  name: department.department_name,
                  abbrev: department.department_abbrev,
                })
              }
            >
              Manage
            </Button>
          )}
        </div>
      }
      adornmentPosition="below"
    >
<div className="flex flex-col gap-2 p-3 sm:p-4">
        {department.programs.map((program) => (
          <ProgramCoverageRow key={program.program_id} program={program} />
        ))}
      </div>
    </AccordionItem>
  );
}

function semNumberLabel(count: number) {
  return count === 1 ? " subject" : " subjects";
}

export function OfferingCoverageOverview({ syId, semesterNumber, onDrillIn }: OfferingCoverageOverviewProps) {
  const hasTerm = syId != null && semesterNumber != null;
  // v2 key: the v1 slot may hold an unscoped payload persisted by an earlier
  // build, so it is never read again.
  const key = hasTerm ? `offering-coverage:v2:${syId}:${semesterNumber}` : "offering-coverage:none";
  const { data, error } = useCachedData<OfferingCoverage>(
    key,
    () => deanService.getOfferingCoverage(syId as number, semesterNumber as number),
    { enabled: hasTerm },
  );

  // The coverage API is scoped to the selected term, so rows are shown as-is.
  const coverageStats = useMemo(() => {
    const status = new Map<number, boolean>();
    for (const department of data?.departments ?? []) {
      for (const program of department.programs) {
        for (const subject of program.subjects) {
          status.set(subject.subject_id, subject.assigned);
        }
      }
    }
    return {
      total: status.size,
      unassigned: [...status.values()].filter((assigned) => !assigned).length,
    };
  }, [data]);

  if (!hasTerm) {
    return (
      <EmptyState title="Select a term">
        Choose an academic term to see which subjects still need a faculty.
      </EmptyState>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load coverage">{error}</EmptyState>;
  }

  if (data == null) {
    return (
      <div role="status" aria-label="Loading coverage" className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (coverageStats.total === 0) {
    return (
      <EmptyState title="Nothing to offer this term">
        No active programs have minor subjects encoded for the selected term.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          College coverage — who still needs a faculty
        </h2>
        <div className="flex items-center gap-2">
          <Tooltip label={COVERAGE_NOTE} direction="bottom" wrap>
            <span
              tabIndex={0}
              className="grid size-5 place-items-center rounded-full text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              aria-label="About shared minor subjects and excluded majors"
            >
              <InfoCircleIcon size={15} />
            </span>
          </Tooltip>
          <Badge tone="slate">Majors not included</Badge>
        </div>
      </div>
<Accordion>
        {data.departments.map((department) => (
          <DepartmentAccordionItem
            key={department.department_id}
            department={department}
            onDrillIn={onDrillIn}
          />
        ))}
      </Accordion>
    </div>
  );
}