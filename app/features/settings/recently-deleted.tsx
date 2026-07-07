import { EmptyState } from "~/components/ui/empty-state";
import { PageHeader } from "~/layouts/page-header";

export function RecentlyDeleted() {
  return (
    <div>
      <PageHeader
        title="Recently Deleted"
        description="Restore items deleted within the last 30 days before they are permanently removed."
      />

      <EmptyState title="No recently deleted items">
        Deleted subjects and other recoverable items will appear here for 30 days.
      </EmptyState>
    </div>
  );
}
