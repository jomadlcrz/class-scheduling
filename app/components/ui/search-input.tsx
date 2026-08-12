import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";

type SearchInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

/** Search field with a leading magnifier icon. */
export function SearchInput({
  id,
  value,
  onChange,
  ariaLabel,
  className,
}: SearchInputProps) {
  return (
    <div className={`relative ${className ?? ""}`.trim()}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? "Search"}
        className={`${inputClassName} pl-9`}
      />
    </div>
  );
}
