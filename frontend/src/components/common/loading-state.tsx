import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
  variant?: "spinner" | "skeleton" | "card";
}

export function LoadingState({
  message = "Loading analytics...",
  description = "Fetching the latest records from the intelligence service.",
  className,
  variant = "spinner",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div
        data-testid="loading-skeleton"
        className={cn("w-full space-y-4 animate-pulse p-6", className)}
      >
        <div className="h-6 w-1/3 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-lg" />
          <div className="h-28 bg-slate-200 rounded-lg" />
          <div className="h-28 bg-slate-200 rounded-lg" />
          <div className="h-28 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      data-testid="loading-spinner"
      className={cn(
        "flex flex-col items-center justify-center min-h-[220px] rounded-lg border border-dashed border-border bg-slate-50/50 p-8 text-center",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{message}</h4>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
