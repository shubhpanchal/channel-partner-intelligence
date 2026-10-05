import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewView } from "@/components/dashboard/overview-view";

describe("OverviewView Component", () => {
  it("renders Phase 1 Foundation Checkpoint banner and KPI placeholders", () => {
    render(<OverviewView />);

    expect(screen.getByText("Phase 1 Foundation Checkpoint")).toBeInTheDocument();
    expect(screen.getByText("Active Partners")).toBeInTheDocument();
    expect(screen.getByText("Channel Lead Flow")).toBeInTheDocument();
    expect(screen.getByText("Visit Conversion")).toBeInTheDocument();
    expect(screen.getByText("Bookings Velocity")).toBeInTheDocument();

    expect(screen.getByText("Pipeline Velocity & Volume Trends")).toBeInTheDocument();
    expect(screen.getByText("Partner Tier Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Recent Channel Activity")).toBeInTheDocument();
    expect(screen.getByText("Attention Center")).toBeInTheDocument();
  });
});
