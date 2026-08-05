import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DownloadIcon, UploadIcon } from "~/components/ui/icons";
import {
  CurriculumBuilderModeToggle,
  type CurriculumBuilderMode,
} from "~/features/subjects/curriculum-builder-mode-toggle";

type CurriculumBuilderActionsBarProps = {
  mode: CurriculumBuilderMode;
  onModeChange: (mode: CurriculumBuilderMode) => void;
  pendingCount?: number;
  isSaving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  /** Hide the Cancel/Save cluster when a wizard's own footer already owns save/cancel actions. */
  showSaveActions?: boolean;
};

export function CurriculumBuilderActionsBar({
  mode,
  onModeChange,
  pendingCount = 0,
  isSaving = false,
  onSave,
  onCancel,
  showSaveActions = true,
}: CurriculumBuilderActionsBarProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-surface-overlay/60">
      <div className="flex flex-wrap items-center gap-1.5">
        <CurriculumBuilderModeToggle value={mode} onChange={onModeChange} />
        <span
          aria-hidden="true"
          className="mx-1 hidden h-6 w-px bg-slate-300 sm:block dark:bg-white/15"
        />
        <Button type="button" variant="outline" block={false} disabled>
          <UploadIcon />
          Import Excel
        </Button>
        <Button type="button" variant="outline" block={false} disabled>
          <DownloadIcon />
          Export Curriculum
        </Button>
      </div>
      {showSaveActions && (
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
      )}
    </Card>
  );
}
