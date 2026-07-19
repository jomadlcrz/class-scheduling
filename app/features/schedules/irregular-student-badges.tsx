import { Badge } from "~/components/ui/badge";

type Subject = { subjectId: number; subjectCode: string };

type SubjectBadgeListProps = {
  subjects: Subject[];
  max?: number;
};

/** Subject code badges, capped at `max` with a "+N more" badge for the rest. */
export function SubjectBadgeList({ subjects, max = 3 }: SubjectBadgeListProps) {
  if (subjects.length === 0) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  const visible = subjects.slice(0, max);
  const hidden = subjects.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((subject) => (
        <Badge key={subject.subjectId} tone="slate">
          {subject.subjectCode}
        </Badge>
      ))}
      {hidden > 0 && <Badge tone="slate">+{hidden} more</Badge>}
    </div>
  );
}
