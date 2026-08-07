import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { IconButton } from "~/components/ui/icon-button";
import { ArchiveIcon, EditIcon, GraduationCapIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Program } from "~/types/program";

type CurriculumHeaderProps = {
  programs: Program[];
  selected: string;
  onChange: (code: string) => void;
  curriculum: ProgramCurriculum | null | "loading";
  /** The selected program's own actions — omitted (not rendered) when there's nothing selected yet. */
  onEditProgram?: () => void;
  onArchiveProgram?: () => void;
};

export function CurriculumHeader({
  programs,
  selected,
  onChange,
  curriculum,
  onEditProgram,
  onArchiveProgram,
}: CurriculumHeaderProps) {
  const selectedProgram = programs.find((p) => p.abbrev === selected);
  const isLoaded = curriculum !== null && curriculum !== "loading";
  const departmentCode = isLoaded ? curriculum.departmentCode : selectedProgram?.departmentAbbrev;
  const hasSubjects = isLoaded && curriculum.groups.length > 0;
  const totalUnits = hasSubjects ? curriculum.totalUnits : null;
  const termCount = hasSubjects ? curriculum.groups.length : null;
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {departmentCode ? (
          <img
            src={departmentLogoUrl(departmentCode)}
            alt={`${departmentCode} logo`}
            onError={onDepartmentLogoError}
            className="size-14 shrink-0 rounded-lg object-contain"
          />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
            <GraduationCapIcon />
          </span>
        )}
        <div className="min-w-0 max-w-xs">
          <FilterDropdown
            id="curriculum-program"
            label="Program"
            allLabel="Select a program…"
            allValue=""
            options={programs.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))}
            value={selected}
            onChange={onChange}
          />
        </div>
        {selectedProgram && (onEditProgram || onArchiveProgram) && (
          <div className="flex shrink-0 items-center gap-1">
            {onEditProgram && (
              <IconButton
                onClick={onEditProgram}
                label={`Edit ${selectedProgram.abbrev}`}
                title="Edit program"
              >
                <EditIcon />
              </IconButton>
            )}
            {onArchiveProgram && (
              <button
                type="button"
                onClick={onArchiveProgram}
                aria-label={`Archive ${selectedProgram.abbrev}`}
                title="Archive program"
                className={archiveActionButtonClassName}
              >
                <ArchiveIcon />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative min-h-16 shrink-0 self-stretch sm:self-auto sm:pl-6 sm:text-right">
        {hasSubjects && (
          <>
            <div
              aria-hidden="true"
              className="blueprint-grid pointer-events-none absolute inset-0 -z-10 text-navy-900/5 dark:text-mist-100/8"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 right-0 -z-10 size-32 opacity-20 dark:opacity-[0.15]"
              style={{ background: "radial-gradient(circle, var(--color-gold-400) 0%, transparent 70%)" }}
            />
          </>
        )}
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Total Units
        </p>
        {totalUnits === null ? (
          <p className="mt-0.5 font-display text-2xl tracking-wide text-slate-300 dark:text-slate-600">—</p>
        ) : (
          <>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={totalUnits}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mt-0.5 font-display text-4xl tabular-nums tracking-wide text-navy-700 dark:text-mist-100"
              >
                {totalUnits}
              </motion.p>
            </AnimatePresence>
            <p className="font-body text-xs text-slate-400 dark:text-slate-500">
              across {termCount} term{termCount !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
