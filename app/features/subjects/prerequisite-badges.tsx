import { Badge } from "~/components/ui/badge";
import { PrerequisiteMoreBadge } from "~/features/subjects/prerequisite-more-badge";

type PrerequisiteBadgesProps = {
  codes: string[];
  /** How many codes to show before collapsing the rest into "+N more". */
  maxVisible?: number;
};

export function PrerequisiteBadges({ codes, maxVisible = 2 }: PrerequisiteBadgesProps) {
  if (codes.length === 0) return null;

  const visible = codes.slice(0, maxVisible);
  const hidden = codes.slice(maxVisible);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((code) => (
        <Badge key={code} tone="slate">
          {code}
        </Badge>
      ))}
      <PrerequisiteMoreBadge
        count={hidden.length}
        items={hidden.map((code) => ({ code }))}
      />
    </div>
  );
}
