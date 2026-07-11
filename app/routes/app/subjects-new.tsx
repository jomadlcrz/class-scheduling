import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
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

  // useEffect(() => {
  //   Promise.all([subjectService.list(), programService.list()]).then(
  //     ([s, p]) => {
  //       setAllSubjects(s);
  //       setPrograms(p);
  //       setProgram(p[0]?.code ?? "");
  //     },
  //   );
  // }, []);

  /** Unsaved work: staged entries or one being edited in the form. */
  const isDirty = pending.length > 0 || editing !== null;
  /** Keyboard reload (F5/Ctrl+R) caught while dirty; shows the styled dialog. */
  const [reloadPromptOpen, setReloadPromptOpen] = useState(false);
  /** Skips the native unload prompt for reloads already confirmed in the dialog. */
  const reloadConfirmed = useRef(false);

  // Browser-native warning on refresh/close while entries are unsaved.
  // Toolbar reloads and tab closes can't show custom UI, so this stays
  // as the fallback for anything the keydown guard below can't catch.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (reloadConfirmed.current) return;
      e.preventDefault();
      // Deprecated, but still required by older Chromium to show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Keyboard reloads start as a keydown inside the page, so those can be
  // intercepted and confirmed with the same dialog as in-app navigation.
  useEffect(() => {
    if (!isDirty) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isReload =
        e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
      if (!isReload) return;
      e.preventDefault();
      setReloadPromptOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty]);

  // Confirm in-app navigation away while entries are unsaved. isSaving is
  // excluded so the post-save redirect to /subjects passes through.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSaving && currentLocation.pathname !== nextLocation.pathname,
  );

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

  // async function handleSave() {
  //   setSaveError(null);
  //   setIsSaving(true);
  //   // Created in insertion order so temp prerequisite ids always resolve
  //   // to subjects created earlier in the same batch.
  //   const realIdByTempId = new Map<string, string>();
  //   const remaining = [...pending];
  //
  //   try {
  //     for (const entry of pending) {
  //       const { tempId, ...input } = entry;
  //       const created = await subjectService.create({
  //         ...input,
  //         // Resolve temp ids to the just-created real ids; drop any that
  //         // can't resolve (e.g. their entry is sitting in the edit form).
  //         prerequisiteIds: input.prerequisiteIds
  //           .map((id) => realIdByTempId.get(id) ?? id)
  //           .filter((id) => !id.startsWith("tmp-")),
  //       });
  //       realIdByTempId.set(tempId, created.id);
  //       remaining.shift();
  //     }
  //     navigate("/subjects");
  //   } catch (err) {
  //     setPending(remaining);
  //     setSaveError(
  //       err instanceof Error
  //         ? err.message
  //         : "Something went wrong. Please try again.",
  //     );
  //     setIsSaving(false);
  //   }
  // }

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
            {/* <Button
              type="button"
              block={false}
              disabled={pending.length === 0}
              isLoading={isSaving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              Save Curriculum{pending.length > 0 ? ` (${pending.length})` : ""}
            </Button> */}
          </>
        }
      />

      <ResultState tone="error" title="Not available">
        This feature is not connected to the backend yet.
      </ResultState>
    </div>
  );
}
