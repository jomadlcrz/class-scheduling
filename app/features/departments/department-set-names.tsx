import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { enrollmentService } from "~/services/enrollment.service";

/** Mirrors DEPARTMENT_SET_NAME_LIMIT; the API enforces it either way. */
const LIMIT = 26;

/**
 * The department's section-name roster.
 *
 * Entered ONCE for the department and reused by every program and year level
 * in it — CITE and Education run A-Z, Criminology the phonetic alphabet,
 * Business the tycoon surnames. The registrar never names sections year by
 * year.
 *
 * A name here is NOT a section. Sections are created by enrollment, one at a
 * time, as each previous one reaches the class-size cap: 90 first-year
 * students means two sections exist and the rest of the roster stays a list.
 */
export function DepartmentSetNames({
  departmentId,
  departmentAbbrev,
  canEdit = true,
}: {
  departmentId: number;
  departmentAbbrev: string;
  canEdit?: boolean;
}) {
  const [names, setNames] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    enrollmentService
      .getDepartmentSetNames(departmentId)
      .then((rows) => {
        if (active) setNames(rows);
      })
      .catch(() => {
        if (active) setNames([]);
      });
    return () => {
      active = false;
    };
  }, [departmentId]);

  const parsed = useMemo(
    () =>
      Array.from(
        new Set(
          draft
            .split(/[\n,]/)
            .map((piece) => piece.trim().toUpperCase())
            .filter(Boolean),
        ),
      ).sort(),
    [draft],
  );
  const overLimit = parsed.length > LIMIT;

  function startEditing() {
    setDraft((names ?? []).join("\n"));
    setEditing(true);
  }

  async function save() {
    if (overLimit) return;
    setSaving(true);
    try {
      const res = await enrollmentService.replaceDepartmentSetNames(departmentId, parsed);
      setNames(res.setNames);
      setEditing(false);
      if (res.message) toast.success(res.message);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save the section names.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
              Section names
            </h2>
            {names && names.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-body text-[0.6875rem] font-semibold tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {names.length} of {LIMIT}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl font-body text-xs text-slate-500 dark:text-slate-400">
            The names {departmentAbbrev}&rsquo;s sections are drawn from, shared by
            every program and year level.
          </p>
        </div>
        {canEdit && !editing && names && names.length > 0 ? (
          <Button variant="outline" block={false} onClick={startEditing} className="shrink-0">
            Edit names
          </Button>
        ) : null}
      </header>

      {editing ? (
        <Card className="p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`set-names-${departmentId}`}
                className="font-body text-xs font-semibold text-navy-700 dark:text-mist-100"
              >
                One per line, or separated by commas
              </label>
              <textarea
                id={`set-names-${departmentId}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100"
                placeholder={"A, B, C\n\n…or one per line"}
              />
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Case, order and spacing do not matter — names are upper-cased,
                trimmed, duplicates dropped, and the list is always kept
                alphabetical.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-100">
                {parsed.length === 0
                  ? "Nothing to save yet"
                  : overLimit
                    ? `${parsed.length} names — ${LIMIT} will be kept, ${parsed.length - LIMIT} will not`
                    : `${parsed.length} name${parsed.length === 1 ? "" : "s"}, in fill order`}
              </p>
              {parsed.length > 0 ? (
                <RosterGrid names={parsed} limit={LIMIT} />
              ) : (
                <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-slate-300 dark:border-white/15">
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                    Names will preview here as you type.
                  </p>
                </div>
              )}
              {overLimit ? (
                <p className="font-body text-xs font-semibold text-rose-700 dark:text-rose-300">
                  A department may hold at most {LIMIT} names, and this is {parsed.length}.
                  Remove {parsed.length - LIMIT} to save.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <Button block={false} onClick={save} disabled={saving || overLimit}>
              {saving ? "Saving…" : "Save names"}
            </Button>
            <Button variant="outline" block={false} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : names == null ? (
        <Card className="p-5">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">Loading section names…</p>
        </Card>
      ) : names.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-slate-300 px-6 py-8 text-center dark:border-white/15">
          <div className="max-w-md">
            <p className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              {departmentAbbrev} has no section names yet
            </p>
            <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
              Enrollment cannot open a section for this department until it has
              names to draw from. Add them once and every program and year level
              uses the same list.
            </p>
          </div>
          {canEdit ? (
            <Button block={false} onClick={startEditing}>Add section names</Button>
          ) : null}
          <p className="font-body text-[0.6875rem] text-slate-400 dark:text-slate-500">
            Most departments use A&ndash;Z; some use the phonetic alphabet, or surnames.
          </p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            Enrollment opens these <strong>in order</strong>, one at a time, as
            each reaches the class-size cap. A name with no students yet still
            belongs here.
          </p>
          <RosterGrid names={names} />
        </Card>
      )}
    </section>
  );
}

function RosterGrid({ names, limit }: { names: string[]; limit?: number }) {
  return (
    <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
      {names.map((name, index) => {
        const dropped = limit != null && index >= limit;
        return (
          <li
            key={name}
            className={`flex items-baseline gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 ${
              dropped
                ? "border-dashed border-rose-200 bg-transparent dark:border-rose-400/25"
                : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5"
            }`}
          >
            <span
              aria-hidden="true"
              className={`shrink-0 font-body text-[0.625rem] font-semibold tabular-nums ${
                dropped
                  ? "text-rose-400 dark:text-rose-300/70"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span
              title={dropped ? `${name} — over the limit, will not be saved` : name}
              className={`min-w-0 flex-1 truncate font-body text-sm font-semibold tracking-wide ${
                dropped
                  ? "text-slate-400 line-through dark:text-slate-500"
                  : "text-navy-800 dark:text-mist-100"
              }`}
            >
              {name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
