import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertIcon, LockIcon } from "~/components/ui/icons";

type DataLoadAlertProps = {
  title: string;
  message: string;
  helpText?: string;
  permission?: boolean;
  onRetry?: () => Promise<void> | void;
  className?: string;
};

/** Consistent inline feedback for reference-data and permission failures. */
export function DataLoadAlert({ title, message, helpText, permission = false, onRetry, className }: DataLoadAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      {permission ? <LockIcon /> : <AlertIcon />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {helpText && <span className="mt-1 block">{helpText}</span>}
      </AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button type="button" variant="outline" block={false} onClick={() => void onRetry()}>Try again</Button>
        </AlertAction>
      )}
    </Alert>
  );
}
