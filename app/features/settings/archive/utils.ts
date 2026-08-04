import type { ArchiveItem } from "~/services/archive.service";

export function formatArchivedAt(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

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

export function archiveSummaryText(item: ArchiveItem): string {
  const summary = item.summary;
  if (!summary) return "—";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (typeof value === "boolean") {
      if (value) parts.push(key.replace(/_/g, " "));
    } else if (typeof value === "number" && value > 0) {
      parts.push(`${value} ${key.replace(/_/g, " ")}`);
    }
  }
  return parts.length > 0 ? parts.join(", ") : "—";
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
