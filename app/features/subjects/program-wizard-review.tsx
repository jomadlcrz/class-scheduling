import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Building2Icon, GraduationCapIcon, LayersIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { TextButton } from "~/components/ui/text-button";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import { groupPendingByYearAndSemester, type PendingEntry } from "~/features/subjects/curriculum-structure";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PROGRAM_TYPE_YEARS } from "~/types/program";

type ProgramWizardReviewProps = {
  newProgram: NewProgramDraft;
  pending: PendingEntry[];
  isSaving: boolean;
  canSave: boolean;
  onEditInfo: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSave: () => void;
};

const metricIconClassName =
  "grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300";

export function ProgramWizardReview({
  newProgram,
  pending,
  isSaving,
  canSave,
  onEditInfo,
  onBack,
  onSaveDraft,
  onSave,
}: ProgramWizardReviewProps) {
  const { yearLevelLabel } = useYearLevels();
  const { semesterLabel } = useSemesters();
  const groups = groupPendingByYearAndSemester(pending);
  const totalUnits = groups.reduce((sum, g) => sum + g.totalUnits, 0);
  const lengthYears = PROGRAM_TYPE_YEARS[newProgram.type] ?? 4;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          Review &amp; Save
        </h2>
        <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
          Check everything below before saving — you can still go back and make changes.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Program Details
              </h3>
              <TextButton onClick={onEditInfo}>Edit</TextButton>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Department</dt>
                <dd className="font-body text-sm text-navy-700 dark:text-mist-100">
                  {newProgram.departmentName || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Abbreviation</dt>
                <dd className="font-body text-sm text-navy-700 dark:text-mist-100">
                  {newProgram.abbrev || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Program Name</dt>
                <dd className="font-body text-sm text-navy-700 dark:text-mist-100">
                  {newProgram.name || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Type</dt>
                <dd className="font-body text-sm text-navy-700 dark:text-mist-100">
                  {newProgram.type || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Length</dt>
                <dd className="font-body text-sm text-navy-700 dark:text-mist-100">{lengthYears} Years</dd>
              </div>
            </dl>
          </Card>

          <div>
            <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Curriculum Overview
            </h3>
            {groups.length === 0 ? (
              <Card className="mt-3 p-6 text-center">
                <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                  No subjects added yet — go back to the Curriculum Builder to add some.
                </p>
              </Card>
            ) : (
              <div className="mt-3">
                <Accordion>
                  {groups.map((group) => (
                    <AccordionItem
                      key={group.yearLevel}
                      defaultOpen
                      title={
                        <span className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
                          {yearLevelLabel(group.yearLevel)}
                        </span>
                      }
                      adornment={<Badge tone="gold">{group.totalUnits} Units</Badge>}
                    >
                      <div className="grid gap-4 p-5 lg:grid-cols-2">
                        {group.semesters.map((semester) => (
                          <div key={semester.semester} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                                {semesterLabel(semester.semester)}
                              </p>
                              <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                                {semester.totalUnits} Units
                              </span>
                            </div>
                            <Table>
                              <TableHead>
                                <TableHeader>Code</TableHeader>
                                <TableHeader>Title</TableHeader>
                                <TableHeader className="text-center">Units</TableHeader>
                                <TableHeader>Type</TableHeader>
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
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>

          <Alert variant="warning">
            <AlertTitle>Please note</AlertTitle>
            <AlertDescription>
              Saving creates the program and every subject listed above together, in one action — there's
              no way to save the program without its curriculum. You can edit or add subjects individually
              afterward from the Subjects page.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="p-5 xl:sticky xl:top-6">
          <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Program summary
          </p>
          <h2 className="mt-1 break-words font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
            {newProgram.abbrev || "Untitled Program"}
          </h2>

          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
            <div className="flex items-center gap-3 py-3">
              <span className={metricIconClassName}>
                <LayersIcon />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Total units</dt>
                <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                  {totalUnits}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <span className={metricIconClassName}>
                <Building2Icon />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Total subjects</dt>
                <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                  {pending.length}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <span className={metricIconClassName}>
                <GraduationCapIcon />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Program length</dt>
                <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                  {lengthYears} Years
                </dd>
              </div>
            </div>
          </dl>
        </Card>
      </div>

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
