import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftIcon } from "~/components/ui/icons";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightAction,
  className = "",
}: ScreenHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const shouldShowBack = showBack || Boolean(onBack);

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-surface-overlay dark:bg-surface/95 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {shouldShowBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="-ml-1 flex size-8 cursor-pointer items-center justify-center rounded-lg text-navy-950 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-mist-100 dark:hover:bg-white/10"
          >
            <ArrowLeftIcon size={20} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg font-bold text-navy-950 dark:text-mist-100 sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightAction && (
        <div className="ml-3 flex shrink-0 items-center gap-2">
          {rightAction}
        </div>
      )}
    </header>
  );
}
