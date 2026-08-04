import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";
import { EmptyState } from "~/components/feedback/empty-state";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { ArchiveCategorySidebar } from "~/features/settings/archive/archive-category-sidebar";
import { ArchiveItemCard } from "~/features/settings/archive/archive-item-card";
import {
  ARCHIVE_PAGE_SUBTITLE,
  ARCHIVE_TAB_TO_CATEGORY,
  ARCHIVE_TABS,
  type ArchiveTabKey,
} from "~/features/settings/archive/constants";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { archiveService, type ArchiveItem } from "~/services/archive.service";
import { studentService } from "~/services/student.service";

/** Settings screen backed by GET/PATCH /archive/*. */
export function ArchivePage() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : "registrar";

  const visibleTabs = useMemo(() => ARCHIVE_TABS.filter((tab) => tab.roles.includes(role)), [role]);
  const [activeTab, setActiveTab] = useState<ArchiveTabKey>(() => visibleTabs[0]?.key ?? "buildings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [counts, setCounts] = useState<Record<ArchiveTabKey, number>>({} as Record<ArchiveTabKey, number>);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLabel, setConfirmLabel] = useState("");
  const [pendingRestore, setPendingRestore] = useState<(() => Promise<string>) | null>(null);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "buildings");
    }
  }, [activeTab, visibleTabs]);

  const totalItems = useMemo(
    () => visibleTabs.reduce((sum, tab) => sum + (counts[tab.key] ?? 0), 0),
    [visibleTabs, counts],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const category = ARCHIVE_TAB_TO_CATEGORY[activeTab];
      const [archiveItems, allCategories] = await Promise.all([
        archiveService.listCategoryItems(category),
        archiveService.list(),
      ]);

      const nextCounts = {} as Record<ArchiveTabKey, number>;
      for (const tab of visibleTabs) {
        const catKey = ARCHIVE_TAB_TO_CATEGORY[tab.key];
        const match = allCategories.find((cat) => cat.key === catKey);
        nextCounts[tab.key] = match?.count ?? 0;
      }

      setCounts(nextCounts);
      setItems(archiveItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function askRestore(label: string, action: () => Promise<string>) {
    setConfirmLabel(label);
    setPendingRestore(() => action);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingRestore) return;
    const message = await pendingRestore();
    if (message) toast.success(message);
    await refresh();
  }

  function handleRestore(item: ArchiveItem) {
    askRestore(item.label, async () =>
      item.entityType === "student"
        ? studentService.restoreProfile(item.entityId)
        : archiveService.restore(item.entityType, item.entityId),
    );
  }

  return (
    <div>
      <SettingsPageHeader title="Archive" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl font-body text-sm text-slate-500 dark:text-slate-400">{ARCHIVE_PAGE_SUBTITLE}</p>
        <span className="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-body text-xs font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-52 lg:shrink-0">
          <ArchiveCategorySidebar
            tabs={visibleTabs}
            activeTab={activeTab}
            counts={counts}
            onSelect={setActiveTab}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {error ? (
            <EmptyState title="Couldn't load archive">{error}</EmptyState>
          ) : loading ? (
            <div
              role="status"
              aria-label="Loading archive"
              className="grid place-items-center py-16 text-navy-700 dark:text-slate-200"
            >
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="Archive is empty">
              Archived items will appear here and can be restored at any time.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <ArchiveItemCard key={`${item.entityType}-${item.entityId}`} item={item} onRestore={handleRestore} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingRestore(null);
        }}
        title="Restore item"
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        onConfirm={handleConfirm}
      >
        <span className="font-medium text-navy-700 dark:text-mist-100">{confirmLabel}</span> will be restored from the
        archive.
      </ConfirmDialog>
    </div>
  );
}
