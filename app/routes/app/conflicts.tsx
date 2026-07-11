import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
import { ConflictPanel } from "~/features/conflicts/conflict-panel";
import { ConflictResolution } from "~/features/conflicts/conflict-resolution";
import { FacultyConflicts } from "~/features/conflicts/faculty-conflicts";
import { RoomConflicts } from "~/features/conflicts/room-conflicts";
import { SectionConflicts } from "~/features/conflicts/section-conflicts";
import { PageHeader } from "~/layouts/page-header";
import { conflictService, type Conflict } from "~/services/conflict.service";

export function meta() {
  return [
    { title: "Conflicts — GWC Class Scheduling" },
    { name: "description", content: "Detect and resolve scheduling conflicts." },
  ];
}

export default function ConflictsRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean", "faculty"]}>
      <ConflictsPage />
    </RoleGuard>
  );
}

type Tab = "faculty" | "room" | "section";

function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("faculty");

  // useEffect(() => {
  //   conflictService.detectAll().then(setConflicts);
  // }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "faculty", label: `Faculty (${conflicts?.filter((c) => c.type === "faculty").length ?? "…"})` },
    { id: "room", label: `Rooms (${conflicts?.filter((c) => c.type === "room").length ?? "…"})` },
    { id: "section", label: `Sections (${conflicts?.filter((c) => c.type === "section").length ?? "…"})` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Conflicts"
        description="Scheduling conflicts detected across faculty, rooms, and sections."
      />

      <div className="mt-4 flex flex-col gap-4">
        <ResultState tone="error" title="Not available">
          This feature is not connected to the backend yet.
        </ResultState>
      </div>
    </div>
  );
}
