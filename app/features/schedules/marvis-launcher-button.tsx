import { Button } from "~/components/ui/button";
import { CalendarCheckIcon, SparkleIcon } from "~/components/ui/icons";

type MarvisLauncherButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

/** Shared entry point for the Marvis scheduling assistant. */
export function MarvisLauncherButton({
  onClick,
  disabled = false,
  className,
}: MarvisLauncherButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      block={false}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      <SparkleIcon size={16} />
      <span>Ask Marvis</span>
    </Button>
  );
}

export function MarvisGenerateProgramButton({
  onClick,
  disabled = false,
  className,
}: MarvisLauncherButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      block={false}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      <CalendarCheckIcon size={16} />
      <span>Generate Program Schedule</span>
    </Button>
  );
}
