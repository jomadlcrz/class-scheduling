import { useState } from "react";
import { AccordionItem } from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
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
  onSaveDraft: () => void;
  onSave: () => void;
};

export function ProgramWizardReview({
  newProgram,
  pending,
  isSaving,
  canSave,
  onBack,
  onSaveDraft,
  onSave,
}: ProgramWizardReviewProps) {
  const { yearLevelLabel } = useYearLevels();
  const { semesterLabel } = useSemesters();
  const groups = groupPendingByYearAndSemester(pending);
  const totalUnits = groups.reduce((sum, g) => sum + g.totalUnits, 0);

  const [expandedYears, setExpandedYears] = useState<ReadonlySet<number>>(
    () => new Set(groups[0] ? [groups[0].yearLevel] : []),
  );

  function toggleYear(yearLevel: number) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(yearLevel)) next.delete(yearLevel);
      else next.add(yearLevel);
      return next;
    });
  }

  const allExpanded = groups.length > 0 && groups.every((g) => expandedYears.has(g.yearLevel));

  function toggleExpandAll() {
    setExpandedYears(allExpanded ? new Set() : new Set(groups.map((g) => g.yearLevel)));
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgramSummaryStrip newProgram={newProgram} totalUnits={totalUnits} />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Curriculum Overview
          </h3>
          {groups.length > 0 && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="cursor-pointer font-body text-xs font-semibold text-blue-700 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
        {groups.length === 0 ? (
          <p className="mt-3 font-body text-sm text-slate-500 dark:text-slate-400">
            No subjects added yet — go back to the Curriculum Builder to add some.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {groups.map((group) => (
              <AccordionItem
                key={group.yearLevel}
                variant="flat"
                open={expandedYears.has(group.yearLevel)}
                onOpenChange={() => toggleYear(group.yearLevel)}
                title={
                  <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                    {yearLevelLabel(group.yearLevel)}
                  </span>
                }
                adornment={<Badge tone="gold">{group.totalUnits} Units</Badge>}
              >
                <div className="flex flex-col gap-2 pb-3">
                  {group.semesters.map((semester, index) => (
                    <AccordionItem
                      key={semester.semester}
                      variant="flat"
                      defaultOpen={index === 0}
                      title={
                        <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                          {semesterLabel(semester.semester)}
                        </span>
                      }
                      adornment={<Badge tone="slate">{semester.totalUnits} Units</Badge>}
                    >
                      <div className="pb-2 pl-1">
                        <Table>
                          <TableHead>
                            <TableHeader>Subject Code</TableHeader>
                            <TableHeader>Descriptive Title</TableHeader>
                            <TableHeader className="text-center">Units</TableHeader>
                            <TableHeader>Subject Type</TableHeader>
                            <TableHeader>Prerequisites</TableHeader>
                          </TableHead>
                          <TableBody>
                            {semester.subjects.map((subject) => (
                              <TableRow key={subject.tempId}>
                                <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                                  {subject.code}
                                </TableCell>
                                <TableCell>{subject.title}</TableCell>
                                <TableCell className="text-center tabular-nums">
                                  {subject.units}
                                </TableCell>
                                <TableCell>
                                  <SubjectTypeBadge type={subject.subjectType} />
                                </TableCell>
                                <TableCell>
                                  {subject.prerequisites.length > 0 ? (
                                    <span
                                      className="block min-w-0 whitespace-normal wrap-break-word leading-5 text-slate-600 dark:text-slate-300"
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
          </div>
        )}
      </Card>

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
        onSaveDraft={onSaveDraft}
        primaryLabel="Save Program"
        onPrimary={onSave}
        primaryDisabled={!canSave}
        isSaving={isSaving}
      />
    </div>
  );
}
