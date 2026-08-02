import { Badge } from "~/components/ui/badge";
import { DropdownMenu } from "~/components/ui/dropdown";
import { CopyIcon, TrashIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableCell, TableRow } from "~/components/ui/table";
import { TableInput } from "~/components/ui/table-input";
import { Checkbox } from "~/components/ui/checkbox";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import {
  PrerequisitePicker,
  type PrerequisiteOption,
} from "~/features/subjects/prerequisite-picker";
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
  onDuplicatePending: (tempId: string) => void;
};

export function CurriculumSubjectRow({
  row,
  index,
  selected,
  onToggleSelected,
  subjectTypes,
  prerequisiteOptions,
  onUpdatePending,
  onRemovePending,
  onDuplicatePending,
}: CurriculumSubjectRowProps) {
  const isEditable = Boolean(row.tempId);

  return (
    <TableRow className={isEditable ? "bg-amber-50/40 dark:bg-gold-400/5" : undefined}>
      <TableCell className="align-top">
        {isEditable ? (
          <Checkbox
            id={`select-${row.key}`}
            hideLabel
            ariaLabel={`Select ${row.code || "new subject"}`}
            checked={selected}
            onChange={() => onToggleSelected()}
          />
        ) : (
          <span className="mt-0.5 inline-block w-4 text-center text-xs text-slate-400">{index + 1}</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        {isEditable && row.tempId ? (
          <TableInput
            value={row.code}
            onChange={(e) => onUpdatePending(row.tempId!, { code: e.target.value })}
            placeholder="IT101"
            className="font-medium"
          />
        ) : (
          <span className="font-medium text-navy-700 dark:text-mist-100">{row.code}</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        {isEditable && row.tempId ? (
          <TableInput
            value={row.title}
            onChange={(e) => onUpdatePending(row.tempId!, { title: e.target.value })}
            placeholder="Introduction to Computing"
          />
        ) : (
          row.title
        )}
      </TableCell>
      <TableCell className="align-top">
        {isEditable && row.tempId ? (
          <TableInput
            type="number"
            min={1}
            max={6}
            value={row.units}
            onChange={(e) => onUpdatePending(row.tempId!, { units: Number(e.target.value) })}
            className="text-center tabular-nums"
          />
        ) : (
          <span className="block text-center tabular-nums">{row.units}</span>
        )}
      </TableCell>
      <TableCell className="align-top">
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
      <TableCell className="align-top">
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
          <div className="flex flex-wrap gap-1">
            {row.prerequisites.map((code) => (
              <Badge key={code} tone="slate">
                {code}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">None</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        {isEditable && row.tempId ? (
          <DropdownMenu
            label={`Actions for ${row.code || "new subject"}`}
            items={[
              {
                label: "Duplicate",
                icon: <CopyIcon />,
                onSelect: () => onDuplicatePending(row.tempId!),
              },
              {
                label: "Delete",
                icon: <TrashIcon />,
                tone: "danger",
                onSelect: () => onRemovePending(row.tempId!),
              },
            ]}
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}
