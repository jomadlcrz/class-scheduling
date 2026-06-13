import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "../../auth/role-guard";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { CurriculumEntryForm } from "../../features/subjects/curriculum-entry-form";
import {
  CurriculumStructure,
  type PendingEntry,
} from "../../features/subjects/curriculum-structure";
import { PageHeader } from "../../layouts/page-header";
import { PROGRAMS } from "../../services/mock-data";
import { subjectService } from "../../services/subject.service";
import type { CreateSubjectInput, Subject } from "../../types/subject";

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
  const [allSubjects, setAllSubjects] = useState<Subject[] | null>(null);
  const [program, setProgram] = useState(PROGRAMS[0].code);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  /** Pending entry pulled back into the form for changes. */
  const [editing, setEditing] = useState<PendingEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    subjectService.list().then(setAllSubjects);
  }, []);

  const savedForProgram = useMemo(
    () => (allSubjects ?? []).filter((s) => s.program === program),
    [allSubjects, program],
  );

  const prerequisiteOptions = useMemo(
    () => [
      ...savedForProgram.map((s) => ({ id: s.id, code: s.code, title: s.title })),
      ...pending.map((p) => ({ id: p.tempId, code: p.code, title: p.title })),
    ],
    [savedForProgram, pending],
  );

  function handleAdd(input: Omit<CreateSubjectInput, "program">) {
    const taken = [...savedForProgram, ...pending].some(
      (s) => s.code.toLowerCase() === input.code.toLowerCase(),
    );
    if (taken) {
      throw new Error(`A subject with the code ${input.code} already exists in ${program}.`);
    }

    // Re-adding an edited entry keeps its temp id so prerequisite
    // references from other pending entries stay intact.
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
      ...(editing ? [...current, editing] : current).filter((p) => p.tempId !== tempId),
    ]);
    setEditing(entry);
  }

  function handleCancelEdit() {
    if (editing) setPending((current) => [...current, editing]);
    setEditing(null);
  }

  function handleRemovePending(tempId: string) {
    // Drop the entry and any pending references to it as a prerequisite.
    setPending((current) =>
      current
        .filter((p) => p.tempId !== tempId)
        .map((p) => ({
          ...p,
          prerequisiteIds: p.prerequisiteIds.filter((id) => id !== tempId),
        })),
    );
  }

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    // Created in insertion order so temp prerequisite ids always resolve
    // to subjects created earlier in the same batch.
    const realIdByTempId = new Map<string, string>();
    const remaining = [...pending];

    try {
      for (const entry of pending) {
        const { tempId, ...input } = entry;
        const created = await subjectService.create({
          ...input,
          // Resolve temp ids to the just-created real ids; drop any that
          // can't resolve (e.g. their entry is sitting in the edit form).
          prerequisiteIds: input.prerequisiteIds
            .map((id) => realIdByTempId.get(id) ?? id)
            .filter((id) => !id.startsWith("tmp-")),
        });
        realIdByTempId.set(tempId, created.id);
        remaining.shift();
      }
      navigate("/subjects");
    } catch (err) {
      setPending(remaining);
      setSaveError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setIsSaving(false);
    }
  }

  return (
    <>
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

      {allSubjects === null ? (
        <div
          role="status"
          aria-label="Loading subjects"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="max-w-xl">
              <Select
                id="curriculum-program"
                label="Program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                disabled={pending.length > 0 || editing !== null}
                hint={
                  pending.length > 0 || editing !== null
                    ? "Save or remove the unsaved entries to switch program."
                    : undefined
                }
              >
                {PROGRAMS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <FormError message={saveError} />

          <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 font-display text-xl tracking-wide text-navy-700 dark:text-white">
                {editing ? `Edit Entry — ${editing.code}` : "Add New Curriculum Entry"}
              </h2>
              <CurriculumEntryForm
                key={editing?.tempId ?? "new"}
                initialEntry={editing ?? undefined}
                prerequisiteOptions={prerequisiteOptions}
                onAdd={handleAdd}
                onCancelEdit={handleCancelEdit}
              />
            </section>

            <section className="flex flex-col rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 shrink-0 font-display text-xl tracking-wide text-navy-700 dark:text-white">
                Curriculum Structure
              </h2>
              {/* Fills the remaining card height; long curricula scroll inside, not the page. */}
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-1">
                <CurriculumStructure
                  program={program}
                  saved={savedForProgram}
                  pending={pending}
                  onEditPending={handleEditPending}
                  onRemovePending={handleRemovePending}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
