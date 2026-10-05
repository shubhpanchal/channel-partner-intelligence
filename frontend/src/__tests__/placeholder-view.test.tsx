import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceholderView } from "@/components/dashboard/placeholder-view";

describe("PlaceholderView Component", () => {
  it("renders roadmap scope blueprint and allows back to overview", () => {
    const handleBack = vi.fn();

    render(
      <PlaceholderView
        sectionKey="partners"
        title="Channel Partners Directory"
        onBackToOverview={handleBack}
      />
    );

    expect(screen.getByText("Channel Partners Directory")).toBeInTheDocument();
    expect(screen.getByText("Scheduled for Phase 2")).toBeInTheDocument();
    expect(screen.getByText("Planned Business Functionality")).toBeInTheDocument();
    expect(screen.getByText("Scope Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Empty State")).toBeInTheDocument();
    expect(screen.getByText("Loading State")).toBeInTheDocument();
    expect(screen.getByText("Error State")).toBeInTheDocument();
  });
});
