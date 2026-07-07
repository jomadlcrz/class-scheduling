import { useId, useRef, useState } from "react";
import { FieldChrome } from "~/components/ui/input";

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
};

/**
 * Tag input backed by a datalist: type or pick a subject code and it becomes
 * a chip inside the field. Matching is by exact code (case-insensitive);
 * Backspace on an empty input removes the last chip.
 */
export function PrerequisitePicker({ options, value, onChange }: PrerequisitePickerProps) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is PrerequisiteOption => Boolean(o));
  const available = options.filter((o) => !value.includes(o.id));
  const disabled = options.length === 0;

  function tryAdd(raw: string): boolean {
    const match = available.find((o) => o.code.toLowerCase() === raw.trim().toLowerCase());
    if (!match) return false;
    onChange([...value, match.id]);
    setQuery("");
    return true;
  }

  return (
    <FieldChrome
      id={inputId}
      label="Prerequisites"
      labelEnd={<span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
    >
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-10.5 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
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
          <option key={option.id} value={option.code}>
            {option.title}
          </option>
        ))}
      </datalist>
    </FieldChrome>
  );
}
