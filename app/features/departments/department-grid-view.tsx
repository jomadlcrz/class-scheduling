import { motion, useReducedMotion, type Variants } from "motion/react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { ArchiveIcon, ChevronRightIcon, EditIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { getBuildingTone } from "~/types/building";
import { DEPARTMENT_TYPE_TONES } from "~/types/department";
import type { Department } from "~/types/department";

type DepartmentGridViewProps = {
  departments: Department[];
  onEdit: (department: Department) => void;
  onArchive: (department: Department) => void;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** Directory-plate grid — one card per department, with its academic programs listed as bullets. */
export function DepartmentGridView({ departments, onEdit, onArchive }: DepartmentGridViewProps) {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.045, delayChildren: reduceMotion ? 0 : 0.02 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.35, ease: EASE_OUT } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {departments.map((dept) => (
        <motion.div key={dept.id} variants={item} whileHover={reduceMotion ? undefined : { y: -4 }} className="h-full">
          <Card className="group relative flex h-full flex-col overflow-hidden p-0 shadow-sm transition-shadow duration-200 hover:shadow-lg">
            <div className="relative h-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-surface-raised/60">
              <img
                src={departmentLogoSrc(dept.logoUrl)}
                alt=""
                aria-hidden="true"
                onError={onDepartmentLogoError}
                className="absolute inset-0 size-full scale-125 object-cover object-center opacity-70 blur-2xl saturate-150"
              />
              <div className="absolute inset-0 bg-white/30 dark:bg-surface/40" />
              <img
                src={departmentLogoSrc(dept.logoUrl)}
                alt={`${dept.abbrev} logo`}
                onError={onDepartmentLogoError}
                className="absolute inset-0 m-auto size-16 object-contain drop-shadow-md transition-transform duration-500 ease-out group-hover:scale-110"
              />

              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(dept)}
                  aria-label={`Edit ${dept.abbrev}`}
                  title="Edit"
                  className={`${actionButtonClassName} bg-white/80 backdrop-blur-sm dark:bg-surface/80`}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onArchive(dept)}
                  aria-label={`Archive ${dept.abbrev}`}
                  title="Archive"
                  className={`${archiveActionButtonClassName} bg-white/80 backdrop-blur-sm dark:bg-surface/80`}
                >
                  <ArchiveIcon />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <p className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">{dept.abbrev}</p>
                <p className="mt-0.5 line-clamp-2 font-body text-sm text-slate-600 dark:text-slate-300">{dept.name}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge tone={DEPARTMENT_TYPE_TONES[dept.departmentType] ?? "slate"}>{dept.departmentType}</Badge>
                <Badge tone={getBuildingTone(dept.buildingName)}>{dept.buildingName}</Badge>
              </div>

              {dept.departmentType !== "Administrative" && (
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Academic Programs
                  </p>
                  {dept.programs.length === 0 ? (
                    <p className="mt-1 font-body text-xs text-slate-400 dark:text-slate-500">No programs yet.</p>
                  ) : (
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 font-body text-xs text-slate-600 dark:text-slate-300">
                      {dept.programs.map((program) => (
                        <li key={program.abbrev}>
                          {program.abbrev} — {program.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {dept.departmentType !== "Administrative" && (
              <Link
                to="/program-curricula"
                className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5 font-body text-sm font-medium text-blue-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-800 dark:border-white/10 dark:bg-white/5 dark:text-blue-300 dark:hover:bg-blue-400/10 dark:hover:text-blue-200"
              >
                <span>View Curriculum</span>
                <ChevronRightIcon />
              </Link>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
