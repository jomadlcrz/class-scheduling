import { useId, useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { TrashIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableCell, TableRow } from "~/components/ui/table";
import { TableInput } from "~/components/ui/table-input";
import type { CurriculumBuilderMode } from "~/features/subjects/curriculum-builder-mode-toggle";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
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

const prereqChipClassName =
  "inline-flex items-center gap-1 rounded-md bg-navy-500/10 px-1.5 py-0.5 text-xs font-medium text-navy-600 dark:bg-navy-300/20 dark:text-slate-200";

/**
 * Hybrid prerequisites field — pick an existing subject or type free text the
 * backend also accepts (a standing phrase like "3rd Year Standing"). Values are
 * stored as plain strings so free text doesn't need an option to exist for.
 */
function PrerequisitesComboboxField({
  tempId,
  ownCode,
  prerequisites,
  options,
  onUpdatePending,
  ariaLabel,
}: {
  tempId: string;
  ownCode: string;
  prerequisites: string[];
  options: PrerequisiteOption[];
  onUpdatePending: (tempId: string, patch: Partial<Omit<CreateSubjectInput, "program">>) => void;
  ariaLabel: string;
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const normalizedOwnCode = ownCode.trim().toLowerCase();

  const availableOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.code.toLowerCase() !== normalizedOwnCode &&
          !prerequisites.some((p) => p.toLowerCase() === o.code.toLowerCase()),
      ),
    [options, normalizedOwnCode, prerequisites],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableOptions;
    return availableOptions.filter(
      (o) => o.code.toLowerCase().includes(q) || o.title.toLowerCase().includes(q),
    );
  }, [availableOptions, query]);

  const trimmedQuery = query.trim();
  const showFreeTextOption =
    trimmedQuery.length > 0 && !filtered.some((o) => o.code.toLowerCase() === trimmedQuery.toLowerCase());

  function addValue(raw: string) {
    const value = raw.trim();
    if (!value || prerequisites.some((p) => p.toLowerCase() === value.toLowerCase())) {
      setQuery("");
      return;
    }
    onUpdatePending(tempId, { prerequisites: [...prerequisites, value] });
    setQuery("");
  }

  function removeValue(value: string) {
    onUpdatePending(tempId, { prerequisites: prerequisites.filter((p) => p !== value) });
  }

  return (
    <Command
      value=""
      onValueChange={(next) => addValue(String(next))}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(value) => String(value)}
    >
      <div className="flex min-h-8.5 min-w-0 cursor-text flex-wrap items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
        {prerequisites.map((value) => (
          <span key={value} className={prereqChipClassName}>
            {value}
            <button
              type="button"
              onClick={() => removeValue(value)}
              aria-label={`Remove ${value}`}
              className="cursor-pointer leading-none text-navy-400 transition-colors duration-150 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <CommandInput
          embedded
          id={inputId}
          aria-label={ariaLabel}
          placeholder={prerequisites.length === 0 ? "Code or e.g. 3rd Year Standing" : "Add another…"}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && query === "" && prerequisites.length > 0) {
              removeValue(prerequisites[prerequisites.length - 1]);
            }
          }}
        />
      </div>

      <CommandList>
        {filtered.length === 0 && !showFreeTextOption ? (
          <CommandEmpty>No subjects found.</CommandEmpty>
        ) : (
          <>
            {filtered.map((option) => (
              <CommandItem key={option.id} value={option.code}>
                {option.code} — {option.title}
              </CommandItem>
            ))}
            {showFreeTextOption && (
              <CommandItem value={trimmedQuery} className="text-blue-700 dark:text-blue-400">
                Add “{trimmedQuery}”
              </CommandItem>
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
}

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
      <TableCell className="md:w-24 md:min-w-24 px-1 align-middle text-center whitespace-nowrap">
        {isEditable && row.tempId ? (
          <div className="mx-auto w-20">
            <TableInput
              type="number"
              min={1}
              max={6}
              step={1}
              placeholder="—"
              value={row.units === 0 ? "" : row.units}
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
              <SelectValue placeholder="Select type" />
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
      <TableCell className="md:w-56 md:max-w-56 min-w-0 align-middle">
        {isEditable && row.tempId ? (
          <PrerequisitesComboboxField
            tempId={row.tempId}
            ownCode={row.code}
            prerequisites={row.prerequisites}
            options={prerequisiteOptions}
            onUpdatePending={onUpdatePending}
            ariaLabel={`Prerequisites for ${row.code || "new subject"}`}
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
