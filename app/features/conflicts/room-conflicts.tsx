import { EmptyState } from "~/components/feedback/empty-state";
import type { Conflict } from "~/services/conflict.service";
import { ConflictCard } from "~/features/conflicts/faculty-conflicts";

type RoomConflictsProps = {
  conflicts: Conflict[];
};

export function RoomConflicts({ conflicts }: RoomConflictsProps) {
  const roomConflicts = conflicts.filter((c) => c.type === "room");

  if (roomConflicts.length === 0) {
    return <EmptyState title="No room conflicts">All room bookings are clear.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {roomConflicts.map((c) => (
        <ConflictCard key={c.id} conflict={c} highlightLabel="Room" />
      ))}
    </div>
  );
}
