import { useId, useMemo, useState } from "react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { FieldChrome, inputClassName } from "~/components/ui/input";

export type PrerequisiteOption = {
  /** Real id for saved subjects, temp id for pending entries. */
  id: string;
  code: string;
  title: string;
};

type PrerequisitePickerProps = {
  options: PrerequisiteOption[];
  /** Selected option ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Table-cell mode: no field label, tighter padding. */
  compact?: boolean;
};

/**
 * Multi-select tag field backed by Command: search or pick a subject and it
 * becomes a chip. Backspace on an empty query removes the last chip.
 */
export function PrerequisitePicker({ options, value, onChange, compact = false }: PrerequisitePickerProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const selected = value
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is PrerequisiteOption => Boolean(o));
  const available = options.filter((o) => !value.includes(o.id));
  const disabled = options.length === 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (o) => o.code.toLowerCase().includes(q) || o.title.toLowerCase().includes(q),
    );
  }, [available, query]);

  const placeholder =
    selected.length === 0 ? (compact ? "None" : "Search subjects…") : compact ? "Add…" : "Add prerequisite…";

  const picker = disabled ? (
    <div className={`${inputClassName} text-slate-400 dark:text-slate-500`}>No subjects available</div>
  ) : (
    <Command
      value=""
      onValueChange={(next) => {
        const id = next as string;
        if (id && !value.includes(id)) {
          onChange([...value, id]);
          setQuery("");
        }
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(id) => options.find((o) => o.id === id)?.code ?? ""}
    >
      <div
        className={`flex cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-sm text-gray-900 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20 ${
          compact ? "min-h-9 px-2 py-1" : "min-h-10.5 px-3 py-2"
        }`}
      >
        {selected.map((option) => (
          <span
            key={option.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-500/10 px-2 py-1 text-xs font-medium text-navy-600 dark:bg-navy-300/20 dark:text-slate-200"
          >
            {option.code}
            <button
              type="button"
              onClick={() => onChange(value.filter((id) => id !== option.id))}
              aria-label={`Remove ${option.code}`}
              className="cursor-pointer leading-none text-navy-400 transition-colors duration-150 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-white"
            >
              ×
            </button>
          </span>
        ))}

        <CommandInput
          embedded
          id={inputId}
          placeholder={placeholder}
          focusPlaceholder="Search subjects…"
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
        />
      </div>

      <CommandList>
        {filtered.length === 0 ? (
          <CommandEmpty>No subjects found.</CommandEmpty>
        ) : (
          filtered.map((option) => (
            <CommandItem key={option.id} value={option.id}>
              {option.code} — {option.title}
            </CommandItem>
          ))
        )}
      </CommandList>
    </Command>
  );

  return compact ? (
    picker
  ) : (
    <FieldChrome
      id={inputId}
      label="Prerequisites"
      labelEnd={<span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
    >
      {picker}
    </FieldChrome>
  );
}
