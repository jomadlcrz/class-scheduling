import { useId, useMemo, useState } from "react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { FieldChrome } from "~/components/ui/input";

export type PrerequisiteOption = {
  /** Real id for saved subjects, temp id for pending entries. */
  id: string;
  code: string;
  title: string;
};

type PrerequisiteComboboxProps = {
  options: PrerequisiteOption[];
  /** Selected prerequisite strings — subject codes or free text (e.g. "3rd Year Standing"). */
  value: string[];
  onChange: (values: string[]) => void;
  /** The subject's own code, excluded from the selectable options. */
  ownCode?: string;
  /** Full-form mode: wraps the field in a labelled FieldChrome shell. */
  labelled?: boolean;
  /** Distinguishes several pickers when more than one is visible. */
  ariaLabel?: string;
};

const prereqChipClassName =
  "inline-flex items-center gap-1 rounded-md bg-navy-500/10 px-1.5 py-0.5 text-xs font-medium text-navy-600 dark:bg-navy-300/20 dark:text-slate-200";

/**
 * Hybrid prerequisites field — pick an existing subject or type free text the
 * backend also accepts (a standing phrase like "3rd Year Standing"). Values are
 * stored as plain strings so free text doesn't need an option to exist for.
 */
export function PrerequisiteCombobox({
  options,
  value,
  onChange,
  ownCode,
  labelled = false,
  ariaLabel,
}: PrerequisiteComboboxProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const normalizedOwnCode = (ownCode ?? "").trim().toLowerCase();

  const availableOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.code.toLowerCase() !== normalizedOwnCode &&
          !value.some((v) => v.toLowerCase() === o.code.toLowerCase()),
      ),
    [options, normalizedOwnCode, value],
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
    const next = raw.trim();
    if (!next || value.some((v) => v.toLowerCase() === next.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...value, next]);
    setQuery("");
  }

  function removeValue(prerequisite: string) {
    onChange(value.filter((v) => v !== prerequisite));
  }

  const picker = (
    <Command
      value=""
      onValueChange={(next) => addValue(String(next))}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(item) => String(item)}
    >
      <div className="flex min-h-8.5 min-w-0 cursor-text flex-wrap items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 transition-colors duration-150 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
        {value.map((prerequisite) => (
          <span key={prerequisite} className={prereqChipClassName}>
            {prerequisite}
            <button
              type="button"
              onClick={() => removeValue(prerequisite)}
              aria-label={`Remove ${prerequisite}`}
              className="cursor-pointer leading-none text-navy-400 transition-colors duration-150 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <CommandInput
          embedded
          id={inputId}
          aria-label={ariaLabel ?? "Prerequisites"}
          placeholder={value.length === 0 ? "Type or select…" : "Add another…"}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && query === "" && value.length > 0) {
              removeValue(value[value.length - 1]);
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

  if (!labelled) return picker;

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
