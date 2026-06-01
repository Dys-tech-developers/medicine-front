import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  variant?: "default" | "error";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-2xl",
          compact ? "h-12 w-12" : "h-14 w-14",
          variant === "error" ? "bg-medical-danger/10" : "bg-medical-secondary"
        )}
      >
        <Icon
          className={cn(
            compact ? "h-6 w-6" : "h-7 w-7",
            variant === "error" ? "text-medical-danger" : "text-medical-primary"
          )}
        />
      </div>
      <p className="text-sm font-semibold text-medical-text">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-medical-mutedText sm:max-w-sm">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
