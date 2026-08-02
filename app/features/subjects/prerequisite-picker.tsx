import { useId, useMemo, useState } from "react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { CheckIcon, ChevronDownIcon } from "~/components/ui/icons";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { Popover } from "~/components/ui/popover";
import { SearchInput } from "~/components/ui/search-input";

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
  /** Table-cell mode: a short summary opens a searchable checklist. */
  compact?: boolean;
  /** Distinguishes compact pickers when several rows are visible. */
  ariaLabel?: string;
};

type PickerProps = Omit<PrerequisitePickerProps, "compact">;

const compactTriggerClassName =
  "inline-flex w-36 max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-body text-xs font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10";

const compactOptionClassName =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left font-body transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10";

function CompactPrerequisitePicker({
  options,
  value,
  onChange,
  ariaLabel,
}: PickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const selected = options.filter((option) => value.includes(option.id));
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter(
      (option) =>
        option.code.toLowerCase().includes(normalizedQuery) ||
        option.title.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  if (options.length === 0) {
    return (
      <span className="inline-flex w-36 max-w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-body text-xs text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
        None available
      </span>
    );
  }

  const summary =
    selected.length === 0
      ? "Select"
      : selected.length === 1
        ? selected[0].code
        : `${selected.length} selected`;

  return (
    <Popover
      label={ariaLabel ?? "Choose prerequisites"}
      trigger={
        <>
          <span className="truncate">{summary}</span>
          <ChevronDownIcon />
        </>
      }
      triggerClassName={compactTriggerClassName}
      className="w-72 max-w-[calc(100vw-1rem)] p-0"
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Prerequisites
              </p>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                {selected.length} selected
              </span>
            </div>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              Choose all subjects that must be completed first.
            </p>
          </div>

          <div className="px-2 pt-2">
            <SearchInput
              id={searchId}
              value={query}
              onChange={setQuery}
              placeholder="Search code or title…"
              ariaLabel="Search prerequisite subjects"
            />
          </div>

          <div className="max-h-56 overflow-y-auto px-1.5 py-2">
            {filtered.length === 0 ? (
              <p role="status" className="px-3 py-6 text-center font-body text-sm text-slate-400 dark:text-slate-500">
                No subjects found.
              </p>
            ) : (
              filtered.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isSelected}
                    className={compactOptionClassName}
                    onClick={() =>
                      onChange(
                        isSelected
                          ? value.filter((id) => id !== option.id)
                          : [...value, option.id],
                      )
                    }
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded border ${
                        isSelected
                          ? "border-navy-700 bg-navy-700 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy-950"
                          : "border-slate-300 bg-white dark:border-white/20 dark:bg-white/5"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? <CheckIcon size={12} strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy-700 dark:text-mist-100">
                        {option.code}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {option.title}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 dark:border-white/10">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => onChange([])}
              className="cursor-pointer rounded-md px-2 py-1 font-body text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                close();
              }}
              className="cursor-pointer rounded-md bg-navy-800 px-3 py-1.5 font-body text-xs font-medium text-white transition-colors hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Searchable tag field used by standalone subject forms. */
function FullPrerequisitePicker({ options, value, onChange }: PickerProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const selected = options.filter((option) => value.includes(option.id));
  const available = options.filter((option) => !value.includes(option.id));
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return available;
    return available.filter(
      (option) =>
        option.code.toLowerCase().includes(normalizedQuery) ||
        option.title.toLowerCase().includes(normalizedQuery),
    );
  }, [available, query]);
  const placeholder = selected.length === 0 ? "Search subjects…" : "Add prerequisite…";
  const chipClassName =
    "inline-flex items-center gap-1.5 rounded-md bg-navy-500/10 px-2 py-1 text-xs font-medium text-navy-600 dark:bg-navy-300/20 dark:text-slate-200";

  const picker = options.length === 0 ? (
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
      itemToStringLabel={(id) => options.find((option) => option.id === id)?.code ?? ""}
    >
      <div className="flex min-h-10.5 min-w-0 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
        {selected.map((option) => (
          <span key={option.id} className={chipClassName}>
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
          onKeyDown={(event) => {
            if (event.key === "Backspace" && query === "" && value.length > 0) {
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

  return (
    <FieldChrome
      id={inputId}
      label="Prerequisites"
      labelEnd={<span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
    >
      {picker}
    </FieldChrome>
  );
}

/** Multi-select prerequisite field with full-form and compact table variants. */
export function PrerequisitePicker({ compact = false, ...props }: PrerequisitePickerProps) {
  return compact ? <CompactPrerequisitePicker {...props} /> : <FullPrerequisitePicker {...props} />;
}
