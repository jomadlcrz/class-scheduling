import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumEntryForm } from "~/features/subjects/curriculum-entry-form";
import {
  CurriculumStructure,
  type PendingEntry,
} from "~/features/subjects/curriculum-structure";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import type { CreateSubjectInput, Subject } from "~/types/subject";

export function meta() {
  return [
    { title: "New Subjects — GWC Class Scheduling" },
    {
      name: "description",
      content: "Add subjects to a program curriculum.",
    },
  ];
}

export default function SubjectsNew() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <SubjectsNewPage />
    </RoleGuard>
  );
}

function SubjectsNewPage() {
  const navigate = useNavigate();
  const formCardObserver = useRef<ResizeObserver | null>(null);
  /** Live height of the form card, so the structure card can cap itself to match and scroll internally. */
  const [formCardHeight, setFormCardHeight] = useState<number>();
  // Callback ref (not a plain ref + mount effect): the form card only enters the DOM
  // once loading finishes, well after the initial mount, so an empty-deps effect
  // would never see it and the observer would never attach.
  const formCardRef = useCallback((node: HTMLDivElement | null) => {
    formCardObserver.current?.disconnect();
    if (!node) return;
    // contentRect excludes the card's own padding/border; getBoundingClientRect
    // reports the border-box height, matching what's actually on screen.
    const observer = new ResizeObserver(() => {
      setFormCardHeight(node.getBoundingClientRect().height);
    });
    observer.observe(node);
    formCardObserver.current = observer;
  }, []);
  const [allSubjects, setAllSubjects] = useState<Subject[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [subjectTypes, setSubjectTypes] = useState<string[]>([]);
  const [program, setProgram] = useState("");
  const [pending, setPending] = useState<PendingEntry[]>([]);
  /** Pending entry pulled back into the form for changes. */
  const [editing, setEditing] = useState<PendingEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Collapsed year/semester sections of the curriculum structure tree. */
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const tempIdCounter = useRef(0);

  useEffect(() => {
    Promise.all([subjectService.list(), programService.list()])
      .then(([s, p]) => {
        setAllSubjects(s);
        setPrograms(p);
        setProgram((current) => current || (p[0]?.code ?? ""));
      })
      .catch(() => {
        setAllSubjects([]);
        setPrograms([]);
      });
    enumService
      .getOptions()
      .then((options) => setSubjectTypes(options.subjectType))
      .catch(() => {});
  }, []);

  /** Unsaved work: staged entries or one being edited in the form. */
  const isDirty = pending.length > 0 || editing !== null;
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const savedForProgram = useMemo(
    () => (allSubjects ?? []).filter((s) => s.program === program),
    [allSubjects, program],
  );

  // Prerequisites are referenced by subject code on the backend.
  const prerequisiteOptions = useMemo(
    () => [
      ...savedForProgram.map((s) => ({ id: s.code, code: s.code, title: s.title })),
      ...pending.map((p) => ({ id: p.code, code: p.code, title: p.title })),
    ],
    [savedForProgram, pending],
  );

  function handleAdd(input: Omit<CreateSubjectInput, "program">) {
    const taken = [...savedForProgram, ...pending].some(
      (s) => s.code.toLowerCase() === input.code.toLowerCase(),
    );
    if (taken) {
      throw new Error(
        `A subject with the code ${input.code} already exists in ${program}.`,
      );
    }

    // Re-adding an edited entry keeps its temp id.
    let tempId = editing?.tempId;
    if (!tempId) {
      tempIdCounter.current += 1;
      tempId = `tmp-${tempIdCounter.current}`;
    }
    setPending((current) => [...current, { ...input, program, tempId }]);
    setEditing(null);
  }

  function handleEditPending(tempId: string) {
    const entry = pending.find((p) => p.tempId === tempId);
    if (!entry) return;
    // Restore the current edit target first so it isn't lost.
    setPending((current) => [
      ...(editing ? [...current, editing] : current).filter(
        (p) => p.tempId !== tempId,
      ),
    ]);
    setEditing(entry);
  }

  function handleCancelEdit() {
    if (editing) setPending((current) => [...current, editing]);
    setEditing(null);
  }

  function handleToggleSection(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleRemovePending(tempId: string) {
    // Drop the entry and any pending references to it as a prerequisite.
    setPending((current) => {
      const removed = current.find((p) => p.tempId === tempId);
      return current
        .filter((p) => p.tempId !== tempId)
        .map((p) => ({
          ...p,
          prerequisites: p.prerequisites.filter((code) => code !== removed?.code),
        }));
    });
  }

  async function handleSave() {
    const selectedProgram = (programs ?? []).find((p) => p.code === program);
    if (!selectedProgram || pending.length === 0) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      // One nested payload creates the whole batch atomically backend-side.
      const message = await subjectService.createCurriculum(
        selectedProgram.code,
        selectedProgram.name,
        pending.map(({ tempId: _tempId, program: _program, ...entry }) => entry),
      );
      if (message) toast.success(message);
      navigate("/subjects");
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsSaving(false);
    }
  }

  const isLoading = allSubjects === null || programs === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="New Subjects"
        description="Add subjects one at a time and review the curriculum structure before saving."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => navigate("/subjects")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={pending.length === 0}
              isLoading={isSaving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              Save Curriculum{pending.length > 0 ? ` (${pending.length})` : ""}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading curriculum"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <FormError message={saveError} />

          <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <div
              ref={formCardRef}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80"
            >
              <FieldChrome id="new-subject-program" label="Program">
                <Select
                  items={(programs ?? []).map((p) => ({ value: p.code, label: `${p.code} — ${p.name}` }))}
                  value={program}
                  onValueChange={(v) => {
                    setProgram(v as string);
                    // Prerequisites belong to a program; switching drops staged work.
                    setPending([]);
                    setEditing(null);
                  }}
                >
                  <SelectTrigger id="new-subject-program">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(programs ?? []).map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.code} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldChrome>

              <CurriculumEntryForm
                key={editing?.tempId ?? "new"}
                initialEntry={editing ?? undefined}
                prerequisiteOptions={prerequisiteOptions}
                subjectTypes={subjectTypes}
                onAdd={handleAdd}
                onCancelEdit={editing ? handleCancelEdit : undefined}
              />
            </div>

            <div
              className="scrollbar-thin rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80 lg:overflow-y-auto"
              style={formCardHeight ? { maxHeight: formCardHeight } : undefined}
            >
              <CurriculumStructure
                program={program}
                saved={savedForProgram}
                pending={pending}
                collapsed={collapsed}
                onToggleSection={handleToggleSection}
                onEditPending={handleEditPending}
                onRemovePending={handleRemovePending}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved subjects?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved curriculum entries. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved subjects?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved curriculum entries. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
