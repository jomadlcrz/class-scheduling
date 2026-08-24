import { Badge, type BadgeTone } from "~/components/ui/badge";

const MODE_TONE: Record<string, BadgeTone> = {
  F2F: "sky",
  Synchronous: "emerald",
  Asynchronous: "violet",
  Blended: "gold",
  Online: "emerald",
  Modular: "violet",
  LAB: "violet",
};

/** Colored pill for a class delivery mode. */
export function ModeBadge({ mode }: { mode: string }) {
  const tone = MODE_TONE[mode] ?? "slate";
  return <Badge tone={tone}>{mode}</Badge>;
}
