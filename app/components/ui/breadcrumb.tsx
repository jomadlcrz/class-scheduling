import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/** First crumb shape: flat (vertical) left edge, pointed right. */
const crumbShapeFirst =
  "[clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_50%,calc(100%_-_14px)_100%,0_100%)]";

/** Subsequent crumb shape: left notch + right point, interlocking into one diagonal seam. */
const crumbShapeNext =
  "[clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_50%,calc(100%_-_14px)_100%,0_100%,14px_50%)]";

const crumbInnerBase =
  "inline-flex h-9 items-center text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400";

const crumbInnerFirstClassName = `${crumbInnerBase} ${crumbShapeFirst} pl-4 pr-6`;
const crumbInnerNextClassName = `${crumbInnerBase} ${crumbShapeNext} pl-6 pr-6`;

const crumbFillLinkClassName =
  "text-navy-700 hover:text-navy-900 dark:text-slate-200 dark:hover:text-white";

const crumbFillActiveClassName = "font-semibold text-navy-800 dark:text-slate-100";

const crumbFillPlainClassName = "text-navy-700 dark:text-slate-200";

/** Bordered ">" chevron seam (matches the container border color). */
const chevronClassName =
  "pointer-events-none absolute inset-y-0 left-0 h-full w-[14px] text-slate-300 dark:text-white/20";

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex min-w-0 items-stretch overflow-hidden rounded-lg border border-slate-300 dark:border-white/15 ${className ?? ""}`.trim()}
    >
      <ol className="flex min-w-0 flex-1 items-stretch">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const innerShape = isFirst ? crumbInnerFirstClassName : crumbInnerNextClassName;
          const fill = isLast ? crumbFillActiveClassName : item.href ? crumbFillLinkClassName : crumbFillPlainClassName;
          const crumbClassName = `${innerShape} ${fill}`.trim();
          const liClassName = isFirst ? "relative min-w-0" : "relative min-w-0 -ml-[14px]";
          const children = (
            <span className="max-w-45 truncate sm:max-w-65">{item.label}</span>
          );
          const chevron = isFirst ? null : (
            <svg className={chevronClassName} viewBox="0 0 14 36" fill="none" aria-hidden="true">
              <polyline
                points="0.75 0.5, 12.5 18, 0.75 35.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
          const trailingChevron = isLast ? (
            <svg
              className="pointer-events-none absolute inset-y-0 right-0 h-full w-3.5 text-slate-300 dark:text-white/20"
              viewBox="0 0 14 36"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                points="0.75 0.5, 12.5 18, 0.75 35.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null;
          const crumb = isLast ? (
            <span className={crumbClassName} aria-current="page">
              {children}
            </span>
          ) : item.href ? (
            <Link to={item.href} className={crumbClassName}>
              {children}
            </Link>
          ) : (
            <span className={crumbClassName}>{children}</span>
          );
          return (
            <li key={item.label} className={liClassName}>
              {crumb}
              {chevron}
              {trailingChevron}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
