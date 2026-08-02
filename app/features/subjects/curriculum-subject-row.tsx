import { Checkbox } from "~/components/ui/checkbox";
import { TrashIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableCell, TableRow } from "~/components/ui/table";
import { TableInput } from "~/components/ui/table-input";
import type { CurriculumBuilderMode } from "~/features/subjects/curriculum-builder-mode-toggle";
import {
  PrerequisitePicker,
  type PrerequisiteOption,
} from "~/features/subjects/prerequisite-picker";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { SUBJECT_TYPE_LABELS, type CreateSubjectInput } from "~/types/subject";

export type CurriculumSubjectRowData = {
  key: string;
  code: string;
  title: string;
  units: number;
  subjectType: string;
  prerequisites: string[];
  tempId?: string;
};

type CurriculumSubjectRowProps = {
  mode: CurriculumBuilderMode;
  row: CurriculumSubjectRowData;
  index: number;
  selected: boolean;
  onToggleSelected: () => void;
  subjectTypes: string[];
  prerequisiteOptions: PrerequisiteOption[];
  onUpdatePending: (tempId: string, patch: Partial<Omit<CreateSubjectInput, "program">>) => void;
  onRemovePending: (tempId: string) => void;
};

const deleteButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400";

export function CurriculumSubjectRow({
  mode,
  row,
  index,
  selected,
  onToggleSelected,
  subjectTypes,
  prerequisiteOptions,
  onUpdatePending,
  onRemovePending,
}: CurriculumSubjectRowProps) {
  const isPending = Boolean(row.tempId);
  const isEditable = isPending && mode === "edit";
  const isViewMode = mode === "view";
  const prerequisiteText = row.prerequisites.join(", ");

  return (
    <TableRow className={isPending ? "bg-amber-50/40 dark:bg-gold-400/5" : undefined}>
      <TableCell className="px-2 text-center align-middle">
        {isEditable ? (
          <Checkbox
            id={`select-${row.key}`}
            inset
            hideLabel
            ariaLabel={`Select ${row.code || "new subject"}`}
            checked={selected}
            onChange={() => onToggleSelected()}
          />
        ) : (
          <span
            className="mx-auto grid size-8 place-items-center font-body text-xs tabular-nums text-slate-400 dark:text-slate-500"
            aria-hidden
          >
            {index + 1}
          </span>
        )}
      </TableCell>
      <TableCell className={`${isViewMode ? "min-w-0" : "md:w-36 min-w-0"} align-middle`}>
        {isEditable && row.tempId ? (
          <TableInput
            value={row.code}
            onChange={(e) => onUpdatePending(row.tempId!, { code: e.target.value })}
            placeholder="IT101"
            className="font-medium"
          />
        ) : (
          <span
            className="block truncate font-medium text-navy-700 dark:text-mist-100"
            title={row.code}
          >
            {row.code}
          </span>
        )}
      </TableCell>
      <TableCell className="min-w-0 align-middle">
        {isEditable && row.tempId ? (
          <TableInput
            value={row.title}
            onChange={(e) => onUpdatePending(row.tempId!, { title: e.target.value })}
            placeholder="Introduction to Computing"
          />
        ) : (
          <span className="block truncate" title={row.title}>
            {row.title}
          </span>
        )}
      </TableCell>
      <TableCell className="w-24 min-w-24 px-1 align-middle text-center whitespace-nowrap">
        {isEditable && row.tempId ? (
          <div className="mx-auto w-20">
            <TableInput
              type="number"
              min={1}
              max={6}
              step={1}
              value={row.units}
              onChange={(e) => onUpdatePending(row.tempId!, { units: Number(e.target.value) })}
              aria-label={`Units for ${row.code || "new subject"}`}
              className="px-1 text-center tabular-nums"
            />
          </div>
        ) : (
          <span className="inline-block tabular-nums">{row.units}</span>
        )}
      </TableCell>
      <TableCell className={`${isViewMode ? "min-w-0" : "md:w-32 min-w-0"} align-middle`}>
        {isEditable && row.tempId ? (
          <Select
            items={subjectTypes.map((type) => ({
              value: type,
              label: SUBJECT_TYPE_LABELS[type] ?? type,
            }))}
            value={row.subjectType}
            onValueChange={(v) => onUpdatePending(row.tempId!, { subjectType: v as string })}
          >
            <SelectTrigger className="py-1.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {SUBJECT_TYPE_LABELS[type] ?? type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <SubjectTypeBadge type={row.subjectType} />
        )}
      </TableCell>
      <TableCell className="w-40 max-w-40 align-middle">
        {isEditable && row.tempId ? (
          <PrerequisitePicker
            compact
            ariaLabel={`Choose prerequisites for ${row.code || "new subject"}`}
            options={prerequisiteOptions.filter(
              (o) => o.code.toLowerCase() !== row.code.trim().toLowerCase(),
            )}
            value={row.prerequisites
              .map((code) => prerequisiteOptions.find((o) => o.code === code)?.id)
              .filter((id): id is string => Boolean(id))}
            onChange={(ids) =>
              onUpdatePending(row.tempId!, {
                prerequisites: ids
                  .map((id) => prerequisiteOptions.find((o) => o.id === id)?.code)
                  .filter((code): code is string => Boolean(code)),
              })
            }
          />
        ) : row.prerequisites.length > 0 ? (
          <span
            className="block min-w-0 whitespace-normal wrap-break-word leading-5 text-slate-600 dark:text-slate-300"
            title={prerequisiteText}
          >
            {prerequisiteText}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">None</span>
        )}
      </TableCell>
      {mode === "edit" && (
        <TableCell className="px-2 align-middle">
          {isEditable && row.tempId ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onRemovePending(row.tempId!)}
                aria-label={`Delete ${row.code || "new subject"}`}
                title="Delete"
                className={deleteButtonClassName}
              >
                <TrashIcon />
              </button>
            </div>
          ) : null}
        </TableCell>
      )}
    </TableRow>
  );
}
