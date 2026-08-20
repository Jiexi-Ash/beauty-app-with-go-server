import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  icon: IconComponent,
  message,
  description,
  size = "default",
  className,
}: {
  icon: Icon;
  message: string;
  description?: string;
  size?: "default" | "sm";
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          size === "sm" ? "size-10" : "size-12",
        )}
      >
        <IconComponent
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "size-4" : "size-6",
          )}
        />
      </div>
      {description ? (
        <>
          <p className="text-sm font-semibold">{message}</p>
          <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        </>
      ) : (
        message
      )}
    </div>
  );
};
