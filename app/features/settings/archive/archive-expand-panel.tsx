import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { BookIcon, ChevronRightIcon, UsersRoundIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { archiveService, type ArchiveEntityType } from "~/services/archive.service";

const PREVIEW_LIMIT = 2;

type ArchiveExpandPanelProps = {
  entityType: ArchiveEntityType;
  entityId: number;
};

function sectionIcon(kind?: string) {
  if (kind === "sets" || kind === "set") return UsersRoundIcon;
  if (kind === "subjects" || kind === "subject") return BookIcon;
  return null;
}

/** GET /archive/:entity_type/:entity_id — nested children for expandable archive cards. */
export function ArchiveExpandPanel({ entityType, entityId }: ArchiveExpandPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    archiveService
      .getDetail(entityType, entityId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading archive details" className="grid place-items-center py-6">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <FormError message={error} />;
  }

  const children = Array.isArray(detail?.children) ? detail.children : [];
  if (children.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 dark:border-white/10">
      {children.map((group, index) => {
        const section = group as {
          kind?: string;
          label?: string;
          count?: number;
          items?: { label?: string; entity_id?: number }[];
        };
        const items = Array.isArray(section.items) ? section.items : [];
        const total = section.count ?? items.length;
        const showAll = expandedSections[index] ?? false;
        const visibleItems = showAll ? items : items.slice(0, PREVIEW_LIMIT);
        const Icon = sectionIcon(section.kind);
        const hasMore = items.length > PREVIEW_LIMIT;

        return (
          <div key={`${section.kind ?? "group"}-${index}`}>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {section.label ?? section.kind} ({total})
            </p>
            {visibleItems.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {visibleItems.map((item, itemIndex) => (
                  <li
                    key={item.entity_id ?? itemIndex}
                    className="flex items-center gap-2 font-body text-sm text-slate-600 dark:text-slate-300"
                  >
                    {Icon ? (
                      <span className="grid size-4 shrink-0 place-items-center text-slate-400 dark:text-slate-500">
                        <Icon />
                      </span>
                    ) : null}
                    <span>{item.label ?? "—"}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {hasMore && !showAll ? (
              <button
                type="button"
                onClick={() => setExpandedSections((current) => ({ ...current, [index]: true }))}
                className="mt-2 inline-flex cursor-pointer items-center gap-0.5 font-body text-xs font-medium text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all {total} {section.label?.toLowerCase() ?? section.kind ?? "items"}
                <ChevronRightIcon />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
