import { EmptyState } from "../../components/ui/empty-state";
import type { Conflict } from "../../services/conflict.service";
import { ConflictCard } from "./faculty-conflicts";

type SectionConflictsProps = {
  conflicts: Conflict[];
};

export function SectionConflicts({ conflicts }: SectionConflictsProps) {
  const sectionConflicts = conflicts.filter((c) => c.type === "section");

  if (sectionConflicts.length === 0) {
    return <EmptyState title="No section conflicts">All section schedules are clear.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sectionConflicts.map((c) => (
        <ConflictCard key={c.id} conflict={c} highlightLabel="Section" />
      ))}
    </div>
  );
}
