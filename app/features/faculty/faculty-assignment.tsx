import { useId, useRef, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { FacultyAvailability } from "~/features/faculty/faculty-availability";
import {
  facultyKey,
  flattenDepartmentSubjects,
  formatInstructorName,
  groupSubjectsByProgram,
  type SubjectChoice,
} from "~/lib/faculty-load";
import { facultyLoadEntrySchema } from "~/schemas/faculty-load.schema";
import type {
  DepartmentFacultyOption,
  DepartmentSubjectProgram,
  FacultyLoadInput,
  FacultyLoadingEntry,
} from "~/types/faculty-load";

type SubjectPickerProps = {
  options: SubjectChoice[];
  value: string[];
  onChange: (keys: string[]) => void;
};

/** Tag input backed by a datalist, same pattern as ~/features/subjects/prerequisite-picker.tsx. */
function SubjectPicker({ options, value, onChange }: SubjectPickerProps) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value
    .map((key) => options.find((o) => o.key === key))
    .filter((o): o is SubjectChoice => Boolean(o));
  const available = options.filter((o) => !value.includes(o.key));
  const disabled = options.length === 0;

  function tryAdd(raw: string): boolean {
    const match = available.find((o) => o.key.toLowerCase() === raw.trim().toLowerCase());
    if (!match) return false;
    onChange([...value, match.key]);
    setQuery("");
    return true;
  }

  return (
    <FieldChrome id={inputId} label="Subjects">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-10.5 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        {selected.map((option) => (
          <span
            key={option.key}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-500/10 px-2 py-1 text-xs font-medium text-navy-600 dark:bg-navy-300/20 dark:text-slate-200"
          >
            {option.programAbbrev} {option.subjectCode}
            <button
              type="button"
              onClick={() => onChange(value.filter((key) => key !== option.key))}
              aria-label={`Remove ${option.subjectCode}`}
              className="cursor-pointer leading-none text-navy-400 transition-colors duration-150 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-white"
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          list={listId}
          value={query}
          disabled={disabled}
          placeholder={
            disabled
              ? "No subjects available"
              : selected.length === 0
                ? "Type a subject code…"
                : ""
          }
          autoComplete="off"
          onChange={(e) => {
            const next = e.target.value;
            if (!tryAdd(next)) setQuery(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              tryAdd(query);
            } else if (e.key === "Backspace" && query === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          className="min-w-24 flex-1 bg-transparent text-sm text-inherit placeholder-slate-400 outline-none disabled:cursor-not-allowed dark:placeholder-slate-500 [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>

      <datalist id={listId}>
        {available.map((option) => (
          <option key={option.key} value={option.key}>
            {option.descriptiveTitle}
          </option>
        ))}
      </datalist>
    </FieldChrome>
  );
}

type FacultyAssignmentFormProps = {
  initialEntry?: FacultyLoadInput;
  faculties: DepartmentFacultyOption[];
  subjectPrograms: DepartmentSubjectProgram[];
  existingLoads: FacultyLoadingEntry[];
  /** Faculty keys already staged in the current batch — excluded from the picker unless editing. */
  stagedKeys: string[];
  onAdd: (entry: FacultyLoadInput) => void;
  onCancelEdit?: () => void;
};

export function FacultyAssignmentForm({
  initialEntry,
  faculties,
  subjectPrograms,
  existingLoads,
  stagedKeys,
  onAdd,
  onCancelEdit,
}: FacultyAssignmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initialEntry);

  const [selectedKey, setSelectedKey] = useState(
    initialEntry ? facultyKey(initialEntry.firstName, initialEntry.lastName) : "",
  );
  const [facultyQuery, setFacultyQuery] = useState(
    initialEntry ? `${initialEntry.firstName} ${initialEntry.lastName}` : "",
  );
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(String(initialEntry?.maxWeeklyHours ?? ""));

  const allSubjects = flattenDepartmentSubjects(subjectPrograms);
  const initialSubjectKeys = initialEntry
    ? initialEntry.programs.flatMap((p) => p.subjects.map((s) => `${p.programAbbrev} ${s.subjectCode}`))
    : [];
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<string[]>(initialSubjectKeys);
  const selectedSubjects = selectedSubjectKeys
    .map((key) => allSubjects.find((s) => s.key === key))
    .filter((s): s is SubjectChoice => Boolean(s));

  const availableFaculties = faculties.filter((f) => {
    const key = facultyKey(f.firstName, f.lastName);
    return isEditing ? key === selectedKey : !stagedKeys.includes(key);
  });
  const filteredFaculties = availableFaculties.filter((f) =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(facultyQuery.trim().toLowerCase()),
  );

  const selectedFaculty = faculties.find((f) => facultyKey(f.firstName, f.lastName) === selectedKey);
  const existingLoad = selectedFaculty
    ? existingLoads.find((l) => l.instructorName === formatInstructorName(selectedFaculty))
    : undefined;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const firstName = selectedFaculty?.firstName ?? initialEntry?.firstName ?? "";
    const lastName = selectedFaculty?.lastName ?? initialEntry?.lastName ?? "";

    const result = facultyLoadEntrySchema.safeParse({
      facultyKey: selectedKey,
      maxWeeklyHours,
      programs: groupSubjectsByProgram(selectedSubjects),
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    onAdd({
      firstName,
      lastName,
      maxWeeklyHours: result.data.maxWeeklyHours,
      programs: result.data.programs,
    });

    if (!isEditing) {
      setSelectedKey("");
      setFacultyQuery("");
      setMaxWeeklyHours("");
      setSelectedSubjectKeys([]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="fl-faculty" label="Faculty">
        {isEditing ? (
          <div className={inputClassName}>{facultyQuery}</div>
        ) : availableFaculties.length === 0 ? (
          <div className={`${inputClassName} text-slate-400 dark:text-slate-500`}>
            No faculty available
          </div>
        ) : (
          <Command
            value={selectedKey}
            onValueChange={(v) => setSelectedKey(v as string)}
            itemToStringLabel={(key) => {
              const f = faculties.find((f) => facultyKey(f.firstName, f.lastName) === key);
              return f ? `${f.firstName} ${f.lastName}` : "";
            }}
            inputValue={facultyQuery}
            onInputValueChange={setFacultyQuery}
          >
            <CommandInput id="fl-faculty" placeholder="Select faculty" focusPlaceholder="Search faculty…" />
            <CommandList>
              {filteredFaculties.length === 0 ? (
                <CommandEmpty>No faculty found.</CommandEmpty>
              ) : (
                filteredFaculties.map((f) => (
                  <CommandItem key={facultyKey(f.firstName, f.lastName)} value={facultyKey(f.firstName, f.lastName)}>
                    {f.firstName} {f.lastName}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        )}
      </FieldChrome>

      {selectedKey && <FacultyAvailability existingLoad={existingLoad} />}

      <Input
        id="fl-max-weekly"
        label="Max Weekly Hours"
        type="number"
        min="0"
        step="0.5"
        placeholder="e.g. 24"
        value={maxWeeklyHours}
        onChange={(e) => setMaxWeeklyHours(e.target.value)}
      />

      <SubjectPicker options={allSubjects} value={selectedSubjectKeys} onChange={setSelectedSubjectKeys} />

      <div className="flex flex-col gap-2">
        <Button>
          <PlusIcon />
          {isEditing ? "Update Faculty Load" : "Add to Batch"}
        </Button>
        {isEditing && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
}
