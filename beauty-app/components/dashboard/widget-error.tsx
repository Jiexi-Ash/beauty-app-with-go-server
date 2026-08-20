import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const WidgetError = ({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <WarningCircle className="size-6 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Retry
      </Button>
    </div>
  );
};
