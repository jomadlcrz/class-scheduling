import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { BookIcon, GraduationCapIcon, LayersIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumEntryForm } from "~/features/subjects/curriculum-entry-form";
import {
  collectSectionKeys,
  CurriculumStructure,
  type PendingEntry,
} from "~/features/subjects/curriculum-structure";
import { PageHeader } from "~/layouts/page-header";
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
  const [allSubjects, setAllSubjects] = useState<Subject[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
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
    Promise.all([subjectService.list(), programService.list()]).then(
      ([s, p]) => {
        setAllSubjects(s);
        setPrograms(p);
        setProgram(p[0]?.code ?? "");
      },
    );
  }, []);

  const savedForProgram = useMemo(
    () => (allSubjects ?? []).filter((s) => s.program === program),
    [allSubjects, program],
  );

  const prerequisiteOptions = useMemo(
    () => [
      ...savedForProgram.map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
      })),
      ...pending.map((p) => ({ id: p.tempId, code: p.code, title: p.title })),
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
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsSaving(false);
    }
  }

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

      {allSubjects === null || programs === null ? (
        <div
          role="status"
          aria-label="Loading subjects"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/8">
              <span className="grid size-8 place-items-center rounded-lg bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-gold-400">
                <GraduationCapIcon />
              </span>
              <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                Target Program
              </span>
            </div>
            <div className="px-5 py-4">
              <div className="max-w-xl">
                <Select
                  id="curriculum-program"
                  label="Program"
                  value={program}
                  onChange={(e) => {
                    setProgram(e.target.value);
                    // A different program shows a different tree; start it expanded.
                    setCollapsed(new Set());
                  }}
                  disabled={pending.length > 0 || editing !== null}
                  hint={
                    pending.length > 0 || editing !== null
                      ? "Save or remove the unsaved entries to switch program."
                      : undefined
                  }
                >
                  {programs.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <FormError message={saveError} />

          <div className="grid gap-5 lg:grid-cols-[26rem_1fr]">
            <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/8">
                <span className="grid size-8 place-items-center rounded-lg bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-gold-400">
                  <BookIcon />
                </span>
                <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                  {editing
                    ? `Edit Entry — ${editing.code}`
                    : "New Curriculum Entry"}
                </span>
              </div>
              <div className="p-5">
                <CurriculumEntryForm
                  key={editing?.tempId ?? "new"}
                  initialEntry={editing ?? undefined}
                  prerequisiteOptions={prerequisiteOptions}
                  onAdd={handleAdd}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
            </section>

            <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/8">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-gold-400">
                    <LayersIcon />
                  </span>
                  <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                    Curriculum Structure
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {pending.length > 0 && (
                    <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 font-body text-xs font-medium text-gold-600 dark:text-gold-400">
                      {pending.length} pending
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCollapsed(new Set())}
                    className="cursor-pointer font-body text-xs font-medium text-navy-600 transition-colors duration-150 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:text-white"
                  >
                    Expand All
                  </button>
                  <span
                    aria-hidden="true"
                    className="text-slate-300 dark:text-slate-600"
                  >
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed(
                        new Set(collectSectionKeys(savedForProgram, pending)),
                      )
                    }
                    className="cursor-pointer font-body text-xs font-medium text-navy-600 transition-colors duration-150 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:text-white"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
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
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
