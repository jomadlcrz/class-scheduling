import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Spinner } from "~/components/ui/spinner";
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

  useEffect(() => {
    conflictService.detectAll().then(setConflicts);
  }, []);

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
        {conflicts === null ? (
          <div
            role="status"
            aria-label="Detecting conflicts"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : (
          <>
            <ConflictPanel conflicts={conflicts} />

            {conflicts.length > 0 && <ConflictResolution />}

            <div>
              <div
                role="tablist"
                aria-label="Conflict types"
                className="flex gap-1 border-b border-slate-200 dark:border-white/8"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 border-b-2 px-3 pb-3 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                      activeTab === tab.id
                        ? "border-navy-700 text-navy-700 dark:border-gold-400 dark:text-gold-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="mt-4">
                {activeTab === "faculty" && <FacultyConflicts conflicts={conflicts} />}
                {activeTab === "room" && <RoomConflicts conflicts={conflicts} />}
                {activeTab === "section" && <SectionConflicts conflicts={conflicts} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
