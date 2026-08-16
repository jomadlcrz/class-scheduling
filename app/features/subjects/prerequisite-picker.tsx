import { useId, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "~/components/ui/combobox";
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
  /** Field label used in full-form mode. */
  label?: string;
  /** Marks the labelled field as required instead of optional. */
  required?: boolean;
  /** Whether a typed value that is not in `options` can be added. */
  allowFreeText?: boolean;
  disabled?: boolean;
};

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
  label = "Prerequisites",
  required = false,
  allowFreeText = true,
  disabled = false,
}: PrerequisiteComboboxProps) {
  const [query, setQuery] = useState("");
  const anchor = useComboboxAnchor();
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
    allowFreeText &&
    trimmedQuery.length > 0 &&
    !value.some((item) => item.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !filtered.some((o) => o.code.toLowerCase() === trimmedQuery.toLowerCase());

  function handleValueChange(next: string[]) {
    onChange(next);
    setQuery("");
  }

  const items = useMemo(
    () =>
      Array.from(
        new Set([
          ...value,
          ...availableOptions.map((option) => option.code),
          ...(showFreeTextOption ? [trimmedQuery] : []),
        ]),
      ),
    [availableOptions, showFreeTextOption, trimmedQuery, value],
  );
  const filteredItems = [
    ...filtered.map((option) => option.code),
    ...(showFreeTextOption ? [trimmedQuery] : []),
  ];

  const picker = (
    <Combobox
      multiple
      autoHighlight
      items={items}
      filteredItems={filteredItems}
      value={value}
      onValueChange={handleValueChange}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((prerequisite) => (
                <ComboboxChip key={prerequisite}>{prerequisite}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={inputId}
                aria-label={ariaLabel ?? label}
                disabled={disabled}
                placeholder={values.length === 0 ? "Search or add prerequisite" : undefined}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No subjects found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => {
            const option = options.find((candidate) => candidate.code === item);
            return (
              <ComboboxItem
                key={option?.id ?? item}
                value={item}
                className={!option ? "text-blue-700 dark:text-blue-400" : ""}
              >
                {option ? `${option.code} — ${option.title}` : `Add “${item}”`}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );

  if (!labelled) return picker;

  return (
    <FieldChrome
      id={inputId}
      label={label}
      labelEnd={
        required ? undefined : (
          <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
        )
      }
      required={required}
    >
      {picker}
    </FieldChrome>
  );
}
