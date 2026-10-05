import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/app/providers";
import * as overviewHook from "@/hooks/use-overview-summary";

const MOCK_DATA = {
  kpis: {
    active_partners: { value: 152, growth_pct: 12.4, breakdown: { tier_1: 18, tier_2: 40, tier_3: 94 } },
    channel_lead_flow: { value: 3906, total_leads: 4018, valid_leads: 3906, qualified_leads: 2891, qualification_rate_pct: 74.01, growth_pct: null },
    site_visits: { total_scheduled: 2010, total_completed: 1743, visit_completion_rate_pct: 86.72, unique_visited_leads: 1472, qualified_lead_to_visit_rate_pct: 50.92, growth_pct: null },
    bookings_velocity: { units_count: 454, confirmed_bookings: 454, confirmed_from_visited_leads: 440, direct_confirmed_bookings: 14, total_value_inr: 4385100000.0, visit_to_booking_rate_pct: 29.89, overall_conversion_rate_pct: 11.62, growth_pct: null },
  },
  tier_breakdown: [
    { tier: "Tier 1 (Elite)", partners_count: 18, percentage: 10.3, contribution: "10.3%" },
    { tier: "Tier 2 (Growth)", partners_count: 45, percentage: 25.7, contribution: "25.7%" },
    { tier: "Tier 3 (Active)", partners_count: 112, percentage: 64.0, contribution: "64.0%" },
  ],
  monthly_trends: [
    { month: "Jan", leads: 304, site_visits: 111, bookings: 22 },
  ],
  recent_activities: [],
  attention_alerts: [],
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>);
}

describe("AppShell Component", () => {
  beforeEach(() => {
    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it("renders top level application shell with header and sidebar", () => {
    renderWithProviders(<AppShell />);

    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByTestId("overview-dashboard-container")).toBeInTheDocument();
  });

  it("navigates to placeholder section when navigation item is clicked", () => {
    renderWithProviders(<AppShell />);

    // Click on Partners navigation
    const partnersNav = screen.getByTestId("nav-item-partners");
    fireEvent.click(partnersNav);

    expect(screen.getAllByText("Channel Partners Directory").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Scheduled for Phase 2")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-view-container")).toBeInTheDocument();

    // Click back to overview
    const backBtn = screen.getByTestId("back-to-overview-button");
    fireEvent.click(backBtn);

    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByTestId("overview-dashboard-container")).toBeInTheDocument();
  });

  it("toggles mobile sidebar visibility", () => {
    renderWithProviders(<AppShell />);

    const toggleBtn = screen.getByTestId("sidebar-toggle-button");
    fireEvent.click(toggleBtn);

    const backdrop = screen.getByTestId("sidebar-backdrop");
    expect(backdrop).toBeInTheDocument();

    // Clicking backdrop closes sidebar
    fireEvent.click(backdrop);
    expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
  });
});
