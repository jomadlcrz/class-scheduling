import { TrashIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableCell, TableRow } from "~/components/ui/table";
import { TableInput } from "~/components/ui/table-input";
import { Checkbox } from "~/components/ui/checkbox";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import {
  PrerequisitePicker,
  type PrerequisiteOption,
} from "~/features/subjects/prerequisite-picker";
import { PrerequisiteBadges } from "~/features/subjects/prerequisite-badges";
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

const unitsInputClassName =
  "box-border w-12 rounded-lg border border-slate-300 bg-white px-1 py-1.5 text-center font-body text-sm tabular-nums text-gray-900 outline-none transition-colors duration-150 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function CurriculumSubjectRow({
  row,
  index,
  selected,
  onToggleSelected,
  subjectTypes,
  prerequisiteOptions,
  onUpdatePending,
  onRemovePending,
}: CurriculumSubjectRowProps) {
  const isEditable = Boolean(row.tempId);

  return (
    <TableRow className={isEditable ? "bg-amber-50/40 dark:bg-gold-400/5" : undefined}>
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
      <TableCell className="min-w-0 align-middle">
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
      <TableCell className="px-1 align-middle text-center whitespace-nowrap">
        {isEditable && row.tempId ? (
          <input
            type="number"
            min={1}
            max={6}
            step={1}
            value={row.units}
            onChange={(e) => onUpdatePending(row.tempId!, { units: Number(e.target.value) })}
            aria-label={`Units for ${row.code || "new subject"}`}
            className={unitsInputClassName}
          />
        ) : (
          <span className="inline-block min-w-12 tabular-nums">{row.units}</span>
        )}
      </TableCell>
      <TableCell className="min-w-0 align-middle">
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
      <TableCell className="min-w-0 align-middle">
        {isEditable && row.tempId ? (
          <PrerequisitePicker
            compact
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
          <PrerequisiteBadges codes={row.prerequisites} maxVisible={2} />
        ) : (
          <span className="text-slate-400 dark:text-slate-500">None</span>
        )}
      </TableCell>
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
    </TableRow>
  );
}
