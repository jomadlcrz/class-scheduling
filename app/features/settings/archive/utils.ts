import type { ArchiveItem } from "~/services/archive.service";

/** e.g. "Archived 3 days ago • Mar 10, 2026" */
export function formatArchivedRelative(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  let relative: string;
  if (diffDays <= 0) relative = "Archived today";
  else if (diffDays === 1) relative = "Archived 1 day ago";
  else relative = `Archived ${diffDays} days ago`;

  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${relative} • ${formatted}`;
}

export function archiveSummaryBadges(item: ArchiveItem): string[] {
  const summary = item.summary;
  if (!summary) return [];
  const badges: string[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (typeof value === "number" && value > 0) {
      badges.push(`${value} ${key.replace(/_/g, " ")}`);
    }
  }
  return badges;
}
