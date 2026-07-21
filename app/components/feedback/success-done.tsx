import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { ResultState } from "~/components/feedback/result-state";

type SuccessDoneProps = {
  title: string;
  /** Body text under the title. */
  children: ReactNode;
  onDone: () => void;
  doneLabel?: string;
};

/** Terminal state for a create flow inside a Modal: success message plus a single "Done" button to close it. */
export function SuccessDone({ title, children, onDone, doneLabel = "Done" }: SuccessDoneProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ResultState tone="success" title={title}>
        {children}
      </ResultState>
      <Button type="button" block={false} onClick={onDone}>
        <span className="px-4">{doneLabel}</span>
      </Button>
    </div>
  );
}
