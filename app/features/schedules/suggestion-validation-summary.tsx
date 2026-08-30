import { useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { ChevronDownIcon } from "~/components/ui/icons";
import type { SuggestionValidation } from "~/types/instructor-review";

const CHECK_TONE: Record<SuggestionValidation["status"], BadgeTone> = {
  passed: "emerald",
  warning: "gold",
  failed: "red",
  deferred: "slate",
};

export function SuggestionValidationSummary({
  validations,
}: {
  validations: SuggestionValidation[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!validations || validations.length === 0) return null;

  const passedCount = validations.filter((v) => v.status === "passed").length;
  const issueCount = validations.filter((v) => v.status === "failed" || v.status === "warning").length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between font-body text-xs font-semibold text-navy-800 dark:text-mist-100"
      >
        <div className="flex items-center gap-2">
          <span>Automated Validation Checks</span>
          <Badge tone={issueCount > 0 ? "gold" : "emerald"}>
            {passedCount}/{validations.length} passed
          </Badge>
        </div>
        <span className={`text-slate-400 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {expanded && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-2.5 dark:border-white/10">
          {validations.map((v, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-xs font-body">
              <span className="text-slate-600 dark:text-slate-300">{v.detail || v.checkCode}</span>
              <Badge tone={CHECK_TONE[v.status] ?? "slate"}>{v.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
