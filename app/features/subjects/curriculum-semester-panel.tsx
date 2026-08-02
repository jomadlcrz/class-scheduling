import { AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { EmptyState } from "~/components/feedback/empty-state";
import {
  BookOpenIcon,
  CopyIcon,
  DownloadIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "~/components/ui/icons";
import { SearchInput } from "~/components/ui/search-input";
import { Switch } from "~/components/ui/switch";
import { Table, TableBody, TableHead, TableHeader } from "~/components/ui/table";
import { TextButton } from "~/components/ui/text-button";
import {
  CurriculumSubjectRow,
  type CurriculumSubjectRowData,
} from "~/features/subjects/curriculum-subject-row";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
import type { CreateSubjectInput } from "~/types/subject";

type CurriculumSemesterPanelProps = {
  semesterNumber: number;
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
  onDuplicatePending,
}: CurriculumSemesterPanelProps) {
  return (
    <AccordionItem
      open={isOpen}
      onOpenChange={onOpenChange}
      className="border-slate-200 dark:border-white/10 dark:bg-surface-raised/80"
      headerClassName="bg-slate-50 px-4 py-3 sm:flex-row dark:bg-surface-overlay/60"
      title={
        <span className="flex items-center gap-2.5">
          <BookOpenIcon />
          <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            {semesterLabel}
          </span>
        </span>
      }
      adornment={<Badge tone="slate">{rows.length} Subject{rows.length === 1 ? "" : "s"}</Badge>}
    >
      <div className="border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-surface-raised/40 lg:flex-row lg:items-center lg:justify-between">
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
              variant="outline"
              block={false}
              disabled={selectedCount === 0}
              onClick={onDeleteSelected}
            >
              <TrashIcon />
              Delete Selected
            </Button>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:inline dark:bg-white/10" />
            <Button type="button" variant="outline" block={false} disabled>
              <UploadIcon />
              Import Excel
            </Button>
            <Button type="button" variant="outline" block={false} disabled>
              <DownloadIcon />
              Export Curriculum
            </Button>
          </div>
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
            <EmptyState title="No subjects in this term">
              Add a subject row to start building {yearLabel} — {semesterLabel}.
            </EmptyState>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableHeader className="w-10">
                  <Checkbox
                    id={`curriculum-select-all-${semesterNumber}`}
                    hideLabel
                    ariaLabel="Select all editable rows"
                    checked={pendingKeys.length > 0 && pendingKeys.every((k) => selected.has(k))}
                    onChange={() => onToggleAll(pendingKeys)}
                  />
                </TableHeader>
                <TableHeader>Subject Code</TableHeader>
                <TableHeader>Descriptive Title</TableHeader>
                <TableHeader className="w-20 text-center">Units</TableHeader>
                <TableHeader className="w-44">Subject Type</TableHeader>
                <TableHeader className="min-w-48">Prerequisites</TableHeader>
                <TableHeader className="w-12" />
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <CurriculumSubjectRow
                    key={row.key}
                    row={row}
                    index={index}
                    selected={selected.has(row.key)}
                    onToggleSelected={() => onToggleSelected(row.key)}
                    subjectTypes={subjectTypes}
                    prerequisiteOptions={prerequisiteOptions}
                    onUpdatePending={onUpdatePending}
                    onRemovePending={onRemovePending}
                    onDuplicatePending={onDuplicatePending}
                  />
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-white/10">
              <TextButton onClick={onAddRow}>+ Add New Subject</TextButton>
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
