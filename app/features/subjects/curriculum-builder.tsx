import { useMemo, useState } from "react";
import { Accordion } from "~/components/ui/accordion";
import { TabList } from "~/components/ui/tabs";
import { CurriculumBuilderActionsBar } from "~/features/subjects/curriculum-builder-actions-bar";
import { CurriculumBuilderHeader } from "~/features/subjects/curriculum-builder-header";
import type { CurriculumBuilderMode } from "~/features/subjects/curriculum-builder-mode-toggle";
import { CurriculumSemesterPanel } from "~/features/subjects/curriculum-semester-panel";
import type { CurriculumSubjectRowData } from "~/features/subjects/curriculum-subject-row";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Program } from "~/types/program";
import type { CreateSubjectInput, Subject } from "~/types/subject";

type CurriculumBuilderProps = {
  program: string;
  programs: Program[];
  onProgramChange: (abbrev: string) => void;
  saved: Subject[];
  pending: PendingEntry[];
  subjectTypes: string[];
  prerequisiteOptions: PrerequisiteOption[];
  collapsed: ReadonlySet<string>;
  onToggleSection: (key: string) => void;
  onUpdatePending: (tempId: string, patch: Partial<Omit<CreateSubjectInput, "program">>) => void;
  onAddPending: (yearLevel: number, semester: number) => void;
  onRemovePending: (tempId: string) => void;
  onDuplicatePending: (tempId: string) => void;
  isSaving: boolean;
  pendingCount: number;
  onSave: () => void;
  onCancel: () => void;
};

function sectionKey(year: number, semester: number) {
  return `y${year}s${semester}`;
}

function sortRows(rows: CurriculumSubjectRowData[], autoSort: boolean) {
  if (!autoSort) return rows;
  return [...rows].sort((a, b) => a.code.localeCompare(b.code, undefined, { sensitivity: "base" }));
}

export function CurriculumBuilder({
  program,
  programs,
  onProgramChange,
  saved,
  pending,
  subjectTypes,
  prerequisiteOptions,
  collapsed,
  onToggleSection,
  onUpdatePending,
  onAddPending,
  onRemovePending,
  onDuplicatePending,
  isSaving,
  pendingCount,
  onSave,
  onCancel,
}: CurriculumBuilderProps) {
  const { semesters, semesterLabel } = useSemesters();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [mode, setMode] = useState<CurriculumBuilderMode>("edit");
  const [activeYear, setActiveYear] = useState<number>(yearLevelIds[0] ?? 1);
  const [search, setSearch] = useState("");
  /** Auto-sort enabled per year/semester section key. */
  const [autoSortSections, setAutoSortSections] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const query = search.trim().toLowerCase();

  const rowsBySemester = useMemo(() => {
    const map = new Map<number, CurriculumSubjectRowData[]>();
    for (const semester of semesters) {
      const semesterNumber = semester.semesterNumber;
      const semesterRows: CurriculumSubjectRowData[] = [
        ...saved
          .filter((s) => s.yearLevel === activeYear && s.semester === semesterNumber)
          .map((s) => ({
            key: `saved-${s.id}`,
            code: s.code,
            title: s.title,
            units: s.units,
            subjectType: s.subjectType,
            prerequisites: s.prerequisites,
          })),
        ...pending
          .filter((p) => p.yearLevel === activeYear && p.semester === semesterNumber)
          .map((p) => ({
            key: p.tempId,
            tempId: p.tempId,
            code: p.code,
            title: p.title,
            units: p.units,
            subjectType: p.subjectType,
            prerequisites: p.prerequisites,
          })),
      ];
      const filtered = query
        ? semesterRows.filter(
            (r) =>
              r.code.toLowerCase().includes(query) ||
              r.title.toLowerCase().includes(query),
          )
        : semesterRows;
      map.set(
        semesterNumber,
        sortRows(filtered, autoSortSections.has(sectionKey(activeYear, semesterNumber))),
      );
    }
    return map;
  }, [saved, pending, activeYear, semesters, query, autoSortSections]);

  function toggleSelected(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllSemester(keys: string[]) {
    const pendingKeys = keys.filter((k) => !k.startsWith("saved-"));
    const allSelected = pendingKeys.length > 0 && pendingKeys.every((k) => selected.has(k));
    setSelected((current) => {
      const next = new Set(current);
      for (const key of pendingKeys) {
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  function deleteSelected() {
    for (const key of selected) {
      if (!key.startsWith("saved-")) onRemovePending(key);
    }
    setSelected(new Set());
  }

  function duplicateSelected() {
    const first = [...selected].find((k) => !k.startsWith("saved-"));
    if (first) onDuplicatePending(first);
  }

  function setAutoSortForSection(section: string, enabled: boolean) {
    setAutoSortSections((current) => {
      const next = new Set(current);
      if (enabled) next.add(section);
      else next.delete(section);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <CurriculumBuilderHeader
        mode={mode}
        program={program}
        programs={programs}
        onProgramChange={onProgramChange}
      />

      <TabList
        ariaLabel="Year level"
        tabs={yearLevelIds.map((year) => ({
          value: year,
          label: yearLevelLabel(year),
        }))}
        value={activeYear}
        onChange={(year) => {
          setActiveYear(year);
          setSelected(new Set());
        }}
      />

      <CurriculumBuilderActionsBar
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setSelected(new Set());
        }}
        pendingCount={pendingCount}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />

      <Accordion>
        {semesters.map(({ semesterNumber: semester }) => {
          const key = sectionKey(activeYear, semester);
          const isOpen = !collapsed.has(key);
          const rows = rowsBySemester.get(semester) ?? [];
          const totalUnits = rows.reduce(
            (sum, r) => sum + (Number.isFinite(r.units) ? r.units : 0),
            0,
          );
          const pendingKeys = rows.filter((r) => r.tempId).map((r) => r.key);
          const selectedInSemester = pendingKeys.filter((k) => selected.has(k)).length;

          return (
            <CurriculumSemesterPanel
              key={semester}
              semesterNumber={semester}
              mode={mode}
              semesterLabel={semesterLabel(semester)}
              yearLabel={yearLevelLabel(activeYear)}
              isOpen={isOpen}
              onOpenChange={(open) => {
                if (open !== isOpen) onToggleSection(key);
              }}
              rows={rows}
              totalUnits={totalUnits}
              pendingKeys={pendingKeys}
              selected={selected}
              onToggleAll={toggleAllSemester}
              onToggleSelected={toggleSelected}
              search={search}
              onSearchChange={setSearch}
              autoSort={autoSortSections.has(key)}
              onAutoSortChange={(enabled) => setAutoSortForSection(key, enabled)}
              selectedCount={selectedInSemester}
              onAddRow={() => onAddPending(activeYear, semester)}
              onDuplicateSelected={duplicateSelected}
              onDeleteSelected={deleteSelected}
              subjectTypes={subjectTypes}
              prerequisiteOptions={prerequisiteOptions}
              onUpdatePending={onUpdatePending}
              onRemovePending={onRemovePending}
              onDuplicatePending={onDuplicatePending}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
