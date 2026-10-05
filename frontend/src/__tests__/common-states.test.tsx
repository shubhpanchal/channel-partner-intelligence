import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Users } from "lucide-react";

describe("Common UI State Components", () => {
  describe("EmptyState", () => {
    it("renders title, description and triggers action button", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          icon={Users}
          title="No Partners"
          description="Register your first broker"
          actionLabel="Add Partner"
          onAction={handleAction}
        />
      );

      expect(screen.getByText("No Partners")).toBeInTheDocument();
      expect(screen.getByText("Register your first broker")).toBeInTheDocument();
      const btn = screen.getByRole("button", { name: "Add Partner" });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe("LoadingState", () => {
    it("renders spinner variant by default", () => {
      render(
        <LoadingState message="Fetching data..." description="Please wait..." />
      );
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Fetching data...")).toBeInTheDocument();
      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("renders skeleton variant", () => {
      render(<LoadingState variant="skeleton" />);
      expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    });
  });

  describe("ErrorState", () => {
    it("renders error message and triggers retry", () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Server Error"
          message="Could not reach database"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText("Server Error")).toBeInTheDocument();
      expect(screen.getByText("Could not reach database")).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Retry Request/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalled();
    });
  });
});
