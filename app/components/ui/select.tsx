import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from "~/components/ui/icons";
import { FieldChrome, inputClassName } from "~/components/ui/input";

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
  id: string;
  label: string;
  hint?: string;
  /** Toolbar mode: no visible label; `label` becomes the aria-label. */
  hideLabel?: boolean;
  /** Show a × button that resets the value to "". */
  clearable?: boolean;
  children: ReactNode;
};

type Option = { value: string; label: string };

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Flattens <option> children (through arrays/fragments) into { value, label } pairs. */
function collectOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === "option") {
        const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
        const text = textOf(props.children);
        out.push({ value: props.value == null ? text : String(props.value), label: text });
      } else {
        walk((child.props as { children?: ReactNode }).children);
      }
    });
  };
  walk(children);
  return out;
}

const menuClassName =
  "z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-navy-900";

export function Select({
  id,
  label,
  hint,
  hideLabel = false,
  clearable = false,
  children,
  ...selectProps
}: SelectProps) {
  const { value, defaultValue, onChange, disabled } = selectProps;
  const isControlled = value !== undefined;
  const options = useMemo(() => collectOptions(children), [children]);

  const [inner, setInner] = useState<string | undefined>(
    defaultValue !== undefined ? String(defaultValue) : undefined,
  );
  // Native <select> semantics: with no (or a stale) value, the first option wins.
  const raw = isControlled ? String(value) : inner;
  const current =
    raw !== undefined && (raw === "" || options.some((o) => o.value === raw))
      ? raw
      : (options[0]?.value ?? "");
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function emit(next: string) {
    if (!isControlled) setInner(next);
    const target = { value: next, name: id };
    onChange?.({ target, currentTarget: target } as unknown as ChangeEvent<HTMLSelectElement>);
  }

  function openMenu() {
    if (disabled) return;
    setQuery("");
    const idx = options.findIndex((o) => o.value === current);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function closeMenu(refocus = true) {
    setOpen(false);
    if (refocus) controlRef.current?.focus();
  }

  function commit(next: string) {
    emit(next);
    closeMenu();
  }

  // Position under the control (flip above / clamp like Popover), match its width,
  // close on outside pointer-down, and refocus the search box while open.
  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const c = controlRef.current?.getBoundingClientRect();
      const m = menuRef.current?.getBoundingClientRect();
      if (!c || !m) return;
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = c.bottom + 6;
      if (top + m.height + margin > vh && c.top - 6 - m.height >= margin) {
        top = c.top - 6 - m.height; // flip above the control
      }
      top = Math.min(Math.max(top, margin), Math.max(margin, vh - m.height - margin));

      let left = Math.min(Math.max(c.left, margin), Math.max(margin, vw - c.width - margin));

      setPos({ top, left, width: c.width });
    };
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!controlRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // The menu is visibility:hidden until measured, and hidden elements refuse
  // focus — so focus the search box only once the menu has a position.
  const positioned = pos !== null;
  useEffect(() => {
    if (open && positioned) searchRef.current?.focus();
  }, [open, positioned]);

  // Menu height changes as the user filters, so re-clamp against the viewport.
  useEffect(() => {
    if (!open) return;
    const c = controlRef.current?.getBoundingClientRect();
    const m = menuRef.current?.getBoundingClientRect();
    if (!c || !m) return;
    const margin = 8;
    const vh = window.innerHeight;
    let top = c.bottom + 6;
    if (top + m.height + margin > vh && c.top - 6 - m.height >= margin) top = c.top - 6 - m.height;
    top = Math.min(Math.max(top, margin), Math.max(margin, vh - m.height - margin));
    setPos((p) => (p ? { ...p, top } : p));
  }, [open, filtered.length]);

  // Keep the active row visible while navigating with the keyboard.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) commit(filtered[active].value);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
    }
  }

  const showClear = clearable && !disabled && current !== "";
  // An empty value reads as "nothing chosen yet" — render its label muted,
  // like react-select's placeholder.
  const isPlaceholder = current === "";

  const control = (
    <div className="relative">
      <button
        ref={controlRef}
        type="button"
        id={id}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `${id}-listbox` : undefined}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`${inputClassName} cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-60 ${showClear ? "pr-16" : "pr-10"}`}
      >
        <span className={`block truncate ${isPlaceholder ? "text-slate-400 dark:text-slate-500" : ""}`}>
          {selected ? selected.label || " " : "Select…"}
        </span>
      </button>
      {showClear && (
        <button
          type="button"
          onClick={() => emit("")}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <CloseIcon size={14} />
        </button>
      )}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-150 dark:text-slate-500 ${open ? "rotate-180" : ""}`}
      >
        <ChevronDownIcon />
      </span>
      <input type="hidden" name={id} value={current} />
      {open &&
        createPortal(
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width,
              visibility: pos ? "visible" : "hidden",
            }}
            className={menuClassName}
          >
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-slate-400 dark:border-white/10 dark:text-slate-500">
                <SearchIcon />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search…"
                  aria-label={`Search ${label.toLowerCase()}`}
                  aria-controls={`${id}-listbox`}
                  aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
                  aria-autocomplete="list"
                  className="w-full bg-transparent font-body text-sm text-gray-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>
              <div ref={listRef} id={`${id}-listbox`} role="listbox" className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 font-body text-sm text-slate-400 dark:text-slate-500">
                    No options
                  </p>
                ) : (
                  filtered.map((o, i) => {
                    const isSelected = o.value === current;
                    return (
                      <div
                        key={`${o.value}-${i}`}
                        id={`${id}-opt-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => commit(o.value)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 font-body text-sm ${
                          i === active ? "bg-slate-100 dark:bg-white/10" : ""
                        } ${
                          isSelected
                            ? "font-medium text-blue-700 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        <span className="truncate">{o.label || " "}</span>
                        {isSelected && (
                          <span aria-hidden="true" className="shrink-0">
                            <CheckIcon />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
          </motion.div>,
          document.body,
        )}
    </div>
  );

  if (hideLabel) return control;

  return (
    <FieldChrome id={id} label={label} hint={hint}>
      {control}
    </FieldChrome>
  );
}
