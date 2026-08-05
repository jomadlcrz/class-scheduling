import { useState } from "react";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import { groupPendingByYearAndSemester, type PendingEntry } from "~/features/subjects/curriculum-structure";
import { ProgramSummaryStrip } from "~/features/subjects/program-summary-strip";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";

type ProgramWizardReviewProps = {
  newProgram: NewProgramDraft;
  pending: PendingEntry[];
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

export function ProgramWizardReview({
  newProgram,
  pending,
  isSaving,
  canSave,
  onBack,
  onSave,
}: ProgramWizardReviewProps) {
  const { yearLevelLabel } = useYearLevels();
  const { semesterLabel } = useSemesters();
  const groups = groupPendingByYearAndSemester(pending);
  const totalUnits = groups.reduce((sum, g) => sum + g.totalUnits, 0);

  function semesterKey(yearLevel: number, semester: number) {
    return `${yearLevel}-${semester}`;
  }

  const [expandedYears, setExpandedYears] = useState<ReadonlySet<number>>(
    () => new Set(groups[0] ? [groups[0].yearLevel] : []),
  );
  const [expandedSemesters, setExpandedSemesters] = useState<ReadonlySet<string>>(() => {
    const firstSemester = groups[0]?.semesters[0];
    return firstSemester ? new Set([semesterKey(groups[0].yearLevel, firstSemester.semester)]) : new Set();
  });

  function toggleYear(yearLevel: number) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(yearLevel)) next.delete(yearLevel);
      else next.add(yearLevel);
      return next;
    });
  }

  function toggleSemester(key: string) {
    setExpandedSemesters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allSemesterKeys = groups.flatMap((g) => g.semesters.map((s) => semesterKey(g.yearLevel, s.semester)));
  const allExpanded =
    groups.length > 0 &&
    groups.every((g) => expandedYears.has(g.yearLevel)) &&
    allSemesterKeys.every((key) => expandedSemesters.has(key));

  function toggleExpandAll() {
    if (allExpanded) {
      setExpandedYears(new Set());
      setExpandedSemesters(new Set());
    } else {
      setExpandedYears(new Set(groups.map((g) => g.yearLevel)));
      setExpandedSemesters(new Set(allSemesterKeys));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgramSummaryStrip newProgram={newProgram} totalUnits={totalUnits} />

      {groups.length === 0 ? (
        <Card className="p-6">
          <EmptyState title="No subjects added yet">
            Go back to the Curriculum Builder to add subjects before reviewing.
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Curriculum Overview
            </h3>
            <button
              type="button"
              onClick={toggleExpandAll}
              className="cursor-pointer font-body text-xs font-semibold text-blue-700 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>

          <Accordion>
            {groups.map((group) => (
              <AccordionItem
                key={group.yearLevel}
                open={expandedYears.has(group.yearLevel)}
                onOpenChange={() => toggleYear(group.yearLevel)}
                title={
                  <span className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
                    {yearLevelLabel(group.yearLevel)}
                  </span>
                }
                adornment={<Badge tone="gold">{group.totalUnits} Units</Badge>}
              >
                <div className="flex flex-col divide-y divide-slate-100 p-2 dark:divide-white/5">
                  {group.semesters.map((semester) => (
                    <AccordionItem
                      key={semester.semester}
                      variant="flat"
                      open={expandedSemesters.has(semesterKey(group.yearLevel, semester.semester))}
                      onOpenChange={() => toggleSemester(semesterKey(group.yearLevel, semester.semester))}
                      title={
                        <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                          {semesterLabel(semester.semester)}
                        </span>
                      }
                      adornment={<Badge tone="slate">{semester.totalUnits} Units</Badge>}
                    >
                      <div className="px-2 pb-3">
                        <Table>
                          <TableHead>
                            <TableHeader className="w-28">Subject Code</TableHeader>
                            <TableHeader className="max-w-56">Descriptive Title</TableHeader>
                            <TableHeader className="text-center">Units</TableHeader>
                            <TableHeader className="w-36">Subject Type</TableHeader>
                            <TableHeader className="max-w-48">Prerequisites</TableHeader>
                          </TableHead>
                          <TableBody>
                            {semester.subjects.map((subject) => (
                              <TableRow key={subject.tempId}>
                                <TableCell className="max-w-28 min-w-0">
                                  <span
                                    className="block truncate font-medium text-navy-700 dark:text-mist-100"
                                    title={subject.code}
                                  >
                                    {subject.code}
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-56 min-w-0">
                                  <span className="block truncate" title={subject.title}>
                                    {subject.title}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center tabular-nums">
                                  {subject.units}
                                </TableCell>
                                <TableCell>
                                  <SubjectTypeBadge type={subject.subjectType} />
                                </TableCell>
                                <TableCell className="max-w-48 min-w-0">
                                  {subject.prerequisites.length > 0 ? (
                                    <span
                                      className="block truncate text-slate-600 dark:text-slate-300"
                                      title={subject.prerequisites.join(", ")}
                                    >
                                      {subject.prerequisites.join(", ")}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-500">None</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionItem>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <Alert variant="info">
        <AlertTitle>Please note</AlertTitle>
        <AlertDescription>
          Once you save, the program and its curriculum are created together and can be managed from the
          Programs page — there's no way to save one without the other.
        </AlertDescription>
      </Alert>

      <ProgramWizardFooter
        backLabel="Back to Curriculum Builder"
        onBack={onBack}
        primaryLabel="Save Program"
        onPrimary={onSave}
        primaryDisabled={!canSave}
        isSaving={isSaving}
      />
    </div>
  );
}
