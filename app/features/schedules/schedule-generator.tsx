import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { scheduleService, type SlotDraft } from "~/services/schedule.service";
import type { ScheduleSemester } from "~/types/schedule";
import type { YearLevel } from "~/types/subject";

const SUBJECT_CODE_RE = /\b([A-Z]{2,4}\d{3,4})\b/g;

function highlightSubjectCode(text: string) {
  const parts = text.split(SUBJECT_CODE_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

export function AutoGenerateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/** Subject-placement failures from the last auto-generate run. Render only when non-empty. */
export function GenerationConflictsAlert({ conflicts }: { conflicts: string[] }) {
  return (
    <Alert variant="warning">
      <AlertTriangleIcon />
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {conflicts.map((c, i) => (
            <li key={i}>{highlightSubjectCode(c)}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

type AutoGenerateParams = {
  schoolYear: string;
  semester: ScheduleSemester;
  semesterLabel: string;
  yearLevel: YearLevel;
  yearLevelLabel: string;
  programId: number;
  setId: number;
};

/**
 * Drives the "auto-generate a schedule" proposal flow: calls the backend algorithm
 * and tracks in-flight/result state. Callers own the generated slots (assigning temp
 * ids, etc.) — this hook only returns the raw proposal.
 */
export function useAutoGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const generate = useCallback(async (params: AutoGenerateParams): Promise<SlotDraft[]> => {
    setIsGenerating(true);
    setConflicts([]);
    try {
      const result = await scheduleService.autoGenerate(params);
      setConflicts(result.conflicts);
      setHasGenerated(true);
      return result.slots;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHasGenerated(false);
    setConflicts([]);
  }, []);

  return { isGenerating, hasGenerated, conflicts, generate, reset };
}
