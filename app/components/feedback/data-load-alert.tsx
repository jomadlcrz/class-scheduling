import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertIcon, LockIcon } from "~/components/ui/icons";
import type { ReactNode } from "react";

type DataLoadAlertProps = {
  title: string;
  message: ReactNode;
  helpText?: string;
  permission?: boolean;
  onRetry?: () => Promise<void> | void;
  action?: ReactNode;
  className?: string;
};

/** Consistent inline feedback for reference-data and permission failures. */
export function DataLoadAlert({ title, message, helpText, permission = false, onRetry, action, className }: DataLoadAlertProps) {
  const permissionFailure = permission || (typeof message === "string" && /permission/i.test(message));

  return (
    <Alert variant="destructive" className={className}>
      {permissionFailure ? <LockIcon /> : <AlertIcon />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {(helpText || permissionFailure) && <span className="mt-1 block">{helpText ?? "Ask an administrator to verify your access to this feature."}</span>}
      </AlertDescription>
      {(onRetry || action) && (
        <AlertAction>
          {action ?? <Button type="button" variant="outline" block={false} onClick={() => void onRetry?.()}>Try again</Button>}
        </AlertAction>
      )}
    </Alert>
  );
}
