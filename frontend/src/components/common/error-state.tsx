import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An unexpected error occurred while communicating with the analytics service.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      className={cn(
        "flex flex-col items-center justify-center min-h-[240px] rounded-lg border border-rose-200 bg-rose-50/40 p-8 text-center",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 border border-rose-200">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-rose-750/80 text-rose-700 mt-1.5 max-w-sm leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
}
