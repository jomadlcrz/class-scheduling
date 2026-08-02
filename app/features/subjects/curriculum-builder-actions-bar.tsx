import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type SemesterOption = {
  id: number;
  semesterNumber: number;
  label: string;
};

type CurriculumBuilderActionsBarProps = {
  semesters: SemesterOption[];
  focusSemester: number;
  onFocusSemesterChange: (semester: number) => void;
  pendingCount: number;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function CurriculumBuilderActionsBar({
  semesters,
  focusSemester,
  onFocusSemesterChange,
  pendingCount,
  isSaving,
  onSave,
  onCancel,
}: CurriculumBuilderActionsBarProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-surface-overlay/60">
      <FieldChrome id="curriculum-focus-semester" label="Semester">
        <div className="w-44">
          <Select
            items={semesters.map((s) => ({
              value: String(s.semesterNumber),
              label: s.label,
            }))}
            value={String(focusSemester)}
            onValueChange={(v) => onFocusSemesterChange(Number(v))}
          >
            <SelectTrigger id="curriculum-focus-semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.semesterNumber)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FieldChrome>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          block={false}
          disabled={pendingCount === 0}
          isLoading={isSaving}
          loadingLabel="Saving…"
          onClick={onSave}
        >
          Save Curriculum{pendingCount > 0 ? ` (${pendingCount})` : ""}
        </Button>
      </div>
    </Card>
  );
}
