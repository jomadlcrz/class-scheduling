import { motion, useReducedMotion, type Variants } from "motion/react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { actionButtonClassName } from "~/features/departments/department-table";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import { getBuildingTone } from "~/types/building";
import type { Department } from "~/types/department";

type DepartmentGridViewProps = {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Directory-plate grid: each card echoes the app's blueprint-grid motif with
 *  architectural corner ticks that reveal on hover. */
export function DepartmentGridView({ departments, onEdit, onDelete }: DepartmentGridViewProps) {
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
      {departments.map((dept) => {
        const programCount = dept.programs.length;
        return (
          <motion.div
            key={dept.id}
            variants={item}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            className="h-full"
          >
            <Card className="group relative flex h-full flex-col overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-lg">
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="relative h-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-navy-900/60">
                <img
                  src={departmentLogoUrl(dept.code)}
                  alt=""
                  aria-hidden="true"
                  onError={onDepartmentLogoError}
                  className="absolute inset-0 size-full scale-125 object-cover object-center opacity-70 blur-2xl saturate-150"
                />
                <div className="absolute inset-0 bg-white/30 dark:bg-navy-950/40" />
                <img
                  src={departmentLogoUrl(dept.code)}
                  alt={`${dept.code} logo`}
                  onError={onDepartmentLogoError}
                  className="absolute inset-0 m-auto size-16 object-contain drop-shadow-md transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="font-display text-xl tracking-wide text-navy-800 dark:text-white">
                    {dept.code}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-body text-sm text-slate-600 dark:text-slate-300">
                    {dept.name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={getBuildingTone(dept.buildingName)}>{dept.buildingName}</Badge>
                  <Badge tone={programCount > 0 ? "emerald" : "slate"}>
                    {programCount} {programCount === 1 ? "Program" : "Programs"}
                  </Badge>
                </div>

                <div className="mt-auto flex justify-end gap-1 border-t border-slate-100 pt-2 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => onEdit(dept)}
                    aria-label={`Edit ${dept.code}`}
                    title="Edit"
                    className={actionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(dept)}
                    aria-label={`Delete ${dept.code}`}
                    title="Delete"
                    className={actionButtonClassName}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
