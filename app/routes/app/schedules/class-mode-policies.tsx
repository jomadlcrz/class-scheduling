import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableSkeleton } from "~/components/ui/skeleton";
import { ClassModePoliciesRulesDrawer } from "~/features/schedules/class-mode-policies-rules-drawer";
import {
  ClassModePolicyForm,
  type ClassModePolicyInput,
} from "~/features/schedules/class-mode-policy-form";
import { ClassModePolicyTable } from "~/features/schedules/class-mode-policy-table";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService, type ClassModePolicy } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";

export function meta() {
  return [
    { title: "Class Delivery Modes — GWC Class Scheduling" },
    {
      name: "description",
      content:
        "Say which subjects are taught face-to-face, online, or a mix, so generated schedules follow it.",
    },
  ];
}

export default function ClassModePoliciesRoute() {
  return (
    <RoleGuard allow={["registrar", "admin"]}>
      <ClassModePoliciesPage />
    </RoleGuard>
  );
}

function ClassModePoliciesPage() {
  const { schoolYears, defaultSchoolYear, loading: syLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semLoading } = useSemesters();

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassModePolicy | null>(null);
  const [deleting, setDeleting] = useState<ClassModePolicy | null>(null);

  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);
  const termReady = Boolean(matchedSy && matchedSem);

  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  const policiesKey = `class-mode-policies:${matchedSy?.id ?? "none"}:${matchedSem?.semesterNumber ?? "none"}`;
  const {
    data: policies,
    error: policiesError,
    reload: reloadPolicies,
  } = useCachedData(
    policiesKey,
    () =>
      scheduleService.listClassModePolicies({
        syId: matchedSy!.id,
        semesterNumber: matchedSem!.semesterNumber,
      }),
    { enabled: termReady },
  );

  const { data: subjectsRaw } = useCachedData("subjects", () => subjectService.list());
  const subjects = useMemo(
    () =>
      (subjectsRaw ?? []).map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        subjectType: s.subjectType,
      })),
    [subjectsRaw],
  );

  const { data: subjectTypesRaw } = useCachedData("subject-types:options", () =>
    scheduleService.getSubjectTypeOptions(),
  );
  const subjectTypes = subjectTypesRaw ?? [];

  const setsKey = `sets-term:${matchedSy?.id ?? "none"}:${matchedSem?.semesterNumber ?? "none"}`;
  const { data: setsData } = useCachedData(
    setsKey,
    () => setService.list({ syId: matchedSy!.id, semesterNumber: matchedSem!.semesterNumber }),
    { enabled: termReady },
  );
  const sets = setsData ?? [];

  async function handleSubmit(input: ClassModePolicyInput) {
    if (!matchedSy || !matchedSem) return;
    const result = await scheduleService.upsertClassModePolicy({
      syId: matchedSy.id,
      semesterNumber: matchedSem.semesterNumber,
      ...input,
    });
    if (result.message) toast.success(result.message);
    setFormOpen(false);
    setEditing(null);
    void reloadPolicies();
  }

  async function handleDelete() {
    if (!deleting) return;
    const message = await scheduleService.deleteClassModePolicy(deleting.id);
    if (message) toast.success(message);
    setDeleting(null);
    void reloadPolicies();
  }

  const loadError = policiesError || null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Class Delivery Modes"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              block={false}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              disabled={!termReady}
            >
              <PlusIcon />
              Add policy
            </Button>
            <ClassModePoliciesRulesDrawer />
          </div>
        }
      />

      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <FieldChrome id="cmp-school-year" label="School year">
            <Select
              items={schoolYears.map((y) => ({ value: y.schoolYear, label: y.schoolYear }))}
              name="cmp-school-year"
              value={schoolYear}
              onValueChange={(v) => v && setSchoolYear(v)}
              disabled={syLoading || schoolYears.length === 0}
            >
              <SelectTrigger id="cmp-school-year">
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((y) => (
                  <SelectItem key={y.id} value={y.schoolYear}>
                    {y.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>

          <FieldChrome id="cmp-semester" label="Semester">
            <Select
              items={semesters.map((s) => ({
                value: String(s.semesterNumber),
                label: semesterLabel(s.semesterNumber),
              }))}
              name="cmp-semester"
              value={String(semester)}
              onValueChange={(v) => v && setSemester(Number(v))}
              disabled={semLoading || semesters.length === 0}
            >
              <SelectTrigger id="cmp-semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.semesterNumber)}>
                    {semesterLabel(s.semesterNumber)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </div>
      </Card>

      <div className="mt-6">
        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : !termReady || policies === null ? (
          <TableSkeleton columns={5} rows={4} />
        ) : policies.length > 0 ? (
          <ClassModePolicyTable
            policies={policies}
            onEdit={(policy) => {
              setEditing(policy);
              setFormOpen(true);
            }}
            onDelete={(policy) => setDeleting(policy)}
          />
        ) : (
          <EmptyState title="Everything is face-to-face">
            No delivery policies for this term, so every subject is generated on campus in a room.
            Add one to teach a subject — or a whole subject type — online or as a mix.
          </EmptyState>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit delivery policy" : "Add delivery policy"}
      >
        <ClassModePolicyForm
          subjects={subjects}
          sets={sets}
          subjectTypes={subjectTypes}
          initial={
            editing
              ? {
                  scope: editing.scope,
                  classMode: editing.classMode,
                  subjectId: editing.subjectId,
                  subjectType: editing.subjectType,
                  setId: editing.setId,
                  onlineMeetings: editing.onlineMeetings,
                  note: editing.note,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete delivery policy"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDelete}
      >
        {deleting
          ? "Remove this policy? Its subjects go back to face-to-face the next time you generate. Meetings already saved keep the mode they were saved with."
          : null}
      </ConfirmDialog>
    </div>
  );
}
