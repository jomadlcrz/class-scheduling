import { Card } from "~/components/ui/card";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import { PROGRAM_TYPE_YEARS } from "~/types/program";

type ProgramSummaryStripProps = {
  newProgram: NewProgramDraft;
  /** Adds a trailing "Total Units" field once the curriculum has something to report (Review step only). */
  totalUnits?: number;
};

/** Read-only recap of Step 1's fields, shown above Steps 2 and 3 so entered info stays visible. */
export function ProgramSummaryStrip({ newProgram, totalUnits }: ProgramSummaryStripProps) {
  const lengthYears = PROGRAM_TYPE_YEARS[newProgram.type] ?? 4;
  const fields = [
    { label: "Department", value: newProgram.departmentName || "—" },
    { label: "Program Abbreviation", value: newProgram.abbrev || "—" },
    { label: "Program Name", value: newProgram.name || "—" },
    { label: "Program Type", value: newProgram.type || "—" },
    { label: "Program Length", value: `${lengthYears} Years` },
    ...(totalUnits !== undefined ? [{ label: "Total Units", value: `${totalUnits} Units` }] : []),
  ];

  return (
    <Card className="border-l-4 border-l-blue-700 p-4 dark:border-l-blue-400 sm:p-5">
      <dl
        className={`grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 ${
          fields.length > 5 ? "lg:grid-cols-6" : "lg:grid-cols-5"
        }`}
      >
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {field.label}
            </dt>
            <dd
              className="mt-0.5 truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100"
              title={field.value}
            >
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
