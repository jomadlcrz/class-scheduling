import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { TextButton } from "~/components/ui/text-button";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import { groupPendingByYearAndSemester, type PendingEntry } from "~/features/subjects/curriculum-structure";
import { ProgramSummaryStrip } from "~/features/subjects/program-summary-strip";
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-xs text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="font-body text-sm text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}

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
  const description = (newProgram.description ?? "").trim();

  return (
    <div className="flex flex-col gap-5">
      <ProgramSummaryStrip newProgram={newProgram} totalUnits={totalUnits} />

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Program Details
            </h3>
            <TextButton onClick={onEditInfo}>Edit</TextButton>
          </div>
          <dl className="mt-3 flex flex-col gap-3">
            <DetailRow label="Department" value={newProgram.departmentName || "—"} />
            <DetailRow label="Program Abbreviation" value={newProgram.abbrev || "—"} />
            <DetailRow label="Program Name" value={newProgram.name || "—"} />
            <DetailRow label="Program Type" value={newProgram.type || "—"} />
            <DetailRow label="Program Length" value={`${lengthYears} Years`} />
            <DetailRow label="Total Units" value={`${totalUnits} Units`} />
            <div>
              <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Program Description</dt>
              <dd className="font-body text-sm text-navy-700 dark:text-mist-100">
                {description || "—"}
              </dd>
              {description && (
                <p className="mt-1 font-body text-xs italic text-slate-400 dark:text-slate-500">
                  Not saved yet — description support is coming to the backend soon.
                </p>
              )}
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
                    <div className="p-4">
                      <Accordion>
                        {group.semesters.map((semester) => (
                          <AccordionItem
                            key={semester.semester}
                            title={
                              <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                                {semesterLabel(semester.semester)}
                              </span>
                            }
                            adornment={<Badge tone="slate">{semester.totalUnits} Units</Badge>}
                          >
                            <div className="p-4">
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
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>

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
