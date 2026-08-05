import { AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { EmptyState } from "~/components/feedback/empty-state";
import { CopyIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import { SearchInput } from "~/components/ui/search-input";
import { Switch } from "~/components/ui/switch";
import { Table, TableBody, TableHead, TableHeader } from "~/components/ui/table";
import { TextButton } from "~/components/ui/text-button";
import {
  CurriculumSubjectRow,
  type CurriculumSubjectRowData,
} from "~/features/subjects/curriculum-subject-row";
import type { CurriculumBuilderMode } from "~/features/subjects/curriculum-builder-mode-toggle";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
import type { CreateSubjectInput } from "~/types/subject";

type CurriculumSemesterPanelProps = {
  semesterNumber: number;
  mode: CurriculumBuilderMode;
  semesterLabel: string;
  yearLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rows: CurriculumSubjectRowData[];
  totalUnits: number;
  pendingKeys: string[];
  selected: ReadonlySet<string>;
  onToggleAll: (keys: string[]) => void;
  onToggleSelected: (key: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  autoSort: boolean;
  onAutoSortChange: (value: boolean) => void;
  selectedCount: number;
  onAddRow: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  subjectTypes: string[];
  prerequisiteOptions: PrerequisiteOption[];
  onUpdatePending: (tempId: string, patch: Partial<Omit<CreateSubjectInput, "program">>) => void;
  onRemovePending: (tempId: string) => void;
  onDuplicatePending: (tempId: string) => void;
};

export function CurriculumSemesterPanel({
  semesterNumber,
  mode,
  semesterLabel,
  yearLabel,
  isOpen,
  onOpenChange,
  rows,
  totalUnits,
  pendingKeys,
  selected,
  onToggleAll,
  onToggleSelected,
  search,
  onSearchChange,
  autoSort,
  onAutoSortChange,
  selectedCount,
  onAddRow,
  onDuplicateSelected,
  onDeleteSelected,
  subjectTypes,
  prerequisiteOptions,
  onUpdatePending,
  onRemovePending,
}: CurriculumSemesterPanelProps) {
  const isViewMode = mode === "view";
  const hasSearch = search.trim().length > 0;

  return (
    <AccordionItem
      open={isOpen}
      onOpenChange={onOpenChange}
      title={
        <span className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          {semesterLabel}
        </span>
      }
      adornment={<Badge tone="slate">{rows.length} Subject{rows.length === 1 ? "" : "s"}</Badge>}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {isViewMode ? (
            <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Read-only preview
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" variant="outline" block={false} onClick={onAddRow}>
                <PlusIcon />
                Add Subject Row
              </Button>
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={selectedCount === 0}
                onClick={onDuplicateSelected}
              >
                <CopyIcon />
                Duplicate Row
              </Button>
              <Button
                type="button"
                variant="danger"
                block={false}
                disabled={selectedCount === 0}
                onClick={onDeleteSelected}
              >
                <TrashIcon />
                Delete Selected
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              id={`curriculum-search-${semesterNumber}`}
              value={search}
              onChange={onSearchChange}
              placeholder="Search subjects…"
              ariaLabel="Search subjects"
              className="min-w-44 flex-1 sm:flex-none"
            />
            <Switch
              id={`curriculum-auto-sort-${semesterNumber}`}
              label="Auto Sort"
              checked={autoSort}
              onChange={onAutoSortChange}
              inline
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={hasSearch ? "No subjects found" : "No subjects in this term"}>
              {hasSearch
                ? "No subjects match your search."
                : isViewMode
                  ? `${yearLabel} — ${semesterLabel} has no subjects to preview.`
                  : `Add a subject row to start building ${yearLabel} — ${semesterLabel}.`}
            </EmptyState>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                {isViewMode ? (
                  <TableHeader className="w-12 px-2 text-center">#</TableHeader>
                ) : (
                  <TableHeader className="px-2 text-center align-middle">
                    <Checkbox
                      id={`curriculum-select-all-${semesterNumber}`}
                      inset
                      hideLabel
                      ariaLabel="Select all editable rows"
                      checked={pendingKeys.length > 0 && pendingKeys.every((k) => selected.has(k))}
                      onChange={() => onToggleAll(pendingKeys)}
                    />
                  </TableHeader>
                )}
                <TableHeader className={isViewMode ? undefined : "md:w-36"}>Subject Code</TableHeader>
                <TableHeader>Descriptive Title</TableHeader>
                <TableHeader className="text-center">Units</TableHeader>
                <TableHeader className={isViewMode ? undefined : "md:w-32"}>Subject Type</TableHeader>
                <TableHeader className="md:w-56 whitespace-nowrap">Prerequisites</TableHeader>
                {!isViewMode && <TableHeader className="px-2" />}
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <CurriculumSubjectRow
                    key={row.key}
                    mode={mode}
                    row={row}
                    index={index}
                    selected={selected.has(row.key)}
                    onToggleSelected={() => onToggleSelected(row.key)}
                    subjectTypes={subjectTypes}
                    prerequisiteOptions={prerequisiteOptions}
                    onUpdatePending={onUpdatePending}
                    onRemovePending={onRemovePending}
                  />
                ))}
              </TableBody>
            </Table>
            <div
              className={`flex flex-wrap items-center gap-3 ${
                isViewMode ? "justify-end" : "justify-between"
              }`}
            >
              {!isViewMode && <TextButton onClick={onAddRow}>+ Add New Subject</TextButton>}
              <p className="font-body text-sm text-slate-600 dark:text-slate-300">
                Total Units:{" "}
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">{totalUnits}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </AccordionItem>
  );
}
