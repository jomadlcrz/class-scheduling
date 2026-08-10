import { Link } from "react-router";
import { ChevronRightIcon } from "~/components/ui/icons";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 font-body text-sm text-slate-500 dark:text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="shrink-0 text-slate-400 dark:text-slate-500">
                  <ChevronRightIcon />
                </span>
              )}
              {isLast ? (
                <span className="font-semibold text-slate-700 dark:text-slate-200" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="rounded-sm transition-colors duration-150 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1 dark:hover:text-blue-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
