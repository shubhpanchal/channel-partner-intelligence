import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OverviewView } from "@/components/dashboard/overview-view";
import * as overviewHook from "@/hooks/use-overview-summary";
import { OverviewSummaryResponse } from "@/lib/api/overview";

const MOCK_OVERVIEW_DATA: OverviewSummaryResponse = {
  kpis: {
    active_partners: {
      value: 152,
      growth_pct: 12.4,
      breakdown: {
        tier_1: 18,
        tier_2: 40,
        tier_3: 94,
      },
    },
    channel_lead_flow: {
      value: 3906,
      total_leads: 4018,
      valid_leads: 3906,
      qualified_leads: 2891,
      qualification_rate_pct: 74.01,
      growth_pct: 18.2,
    },
    site_visits: {
      total_scheduled: 2010,
      total_completed: 1743,
      visit_completion_rate_pct: 86.72,
      unique_visited_leads: 1472,
      qualified_lead_to_visit_rate_pct: 50.92,
      growth_pct: 4.1,
    },
    bookings_velocity: {
      units_count: 454,
      confirmed_bookings: 454,
      confirmed_from_visited_leads: 440,
      direct_confirmed_bookings: 14,
      total_value_inr: 4385100000.0,
      visit_to_booking_rate_pct: 29.89,
      overall_conversion_rate_pct: 11.62,
      growth_pct: 23.0,
    },
  },
  tier_breakdown: [
    {
      tier: "Tier 1 (Elite)",
      partners_count: 18,
      percentage: 10.3,
      contribution: "10.3%",
    },
    {
      tier: "Tier 2 (Growth)",
      partners_count: 45,
      percentage: 25.7,
      contribution: "25.7%",
    },
    {
      tier: "Tier 3 (Active)",
      partners_count: 112,
      percentage: 64.0,
      contribution: "64.0%",
    },
  ],
  monthly_trends: [
    {
      month: "Jan",
      leads: 304,
      site_visits: 111,
      bookings: 22,
    },
    {
      month: "Feb",
      leads: 287,
      site_visits: 98,
      bookings: 23,
    },
  ],
  recent_activities: [
    {
      id: "act-1",
      partner_name: "Apex Real Estate Advisors",
      action: "Booking confirmed for Rajesh Kale.",
      logged_at: "2026-12-31T23:51:00Z",
      time_ago: "2h ago",
      status: "success",
      tag: "Booking",
    },
    {
      id: "act-2",
      partner_name: "Horizon Property Consultants",
      action: "Site visit completed for Siddharth More.",
      logged_at: "2026-12-31T23:45:00Z",
      time_ago: "11m ago",
      status: "success",
      tag: "Site Visit",
    },
  ],
  attention_alerts: [
    {
      id: "alert-inv-prj-101",
      title: "Low Inventory: Solaris Residences",
      description: "Solaris Residences has only 12 units (2.7%) remaining in sales inventory.",
      severity: "warning",
    },
  ],
};

describe("OverviewView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state when query is loading", () => {
    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OverviewView />);
    expect(screen.getByTestId("overview-loading-state")).toBeInTheDocument();
    expect(
      screen.getByText("Loading channel partner intelligence overview...")
    ).toBeInTheDocument();
  });

  it("renders error state and handles retry action", () => {
    const mockRefetch = vi.fn();
    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network connection timeout"),
      refetch: mockRefetch,
    } as any);

    render(<OverviewView />);
    expect(screen.getByTestId("overview-error-state")).toBeInTheDocument();
    expect(screen.getByText("Unable to Load Overview Data")).toBeInTheDocument();
    expect(screen.getByText("Network connection timeout")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Retry Request/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when data has zero records", () => {
    const emptyData: OverviewSummaryResponse = {
      kpis: {
        active_partners: {
          value: 0,
          growth_pct: null,
          breakdown: { tier_1: 0, tier_2: 0, tier_3: 0 },
        },
        channel_lead_flow: {
          value: 0,
          total_leads: 0,
          valid_leads: 0,
          qualified_leads: 0,
          qualification_rate_pct: 0,
          growth_pct: null,
        },
        site_visits: {
          total_scheduled: 0,
          total_completed: 0,
          visit_completion_rate_pct: 0,
          unique_visited_leads: 0,
          qualified_lead_to_visit_rate_pct: 0,
          growth_pct: null,
        },
        bookings_velocity: {
          units_count: 0,
          confirmed_bookings: 0,
          confirmed_from_visited_leads: 0,
          direct_confirmed_bookings: 0,
          total_value_inr: 0,
          visit_to_booking_rate_pct: 0,
          overall_conversion_rate_pct: 0,
          growth_pct: null,
        },
      },
      tier_breakdown: [],
      monthly_trends: [],
      recent_activities: [],
      attention_alerts: [],
    };

    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OverviewView />);
    expect(screen.getByTestId("overview-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No Channel Activity Found")).toBeInTheDocument();
  });

  it("renders real API-backed metrics and dashboard widgets correctly", () => {
    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: MOCK_OVERVIEW_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OverviewView />);

    // Top banner
    expect(screen.getByText("Live Executive Intelligence Stream")).toBeInTheDocument();

    // 1. Active Partners Card
    expect(screen.getByTestId("kpi-value-active-partners")).toHaveTextContent("152");
    expect(screen.getByText(/18 Tier-1 \/ 40 Tier-2 \/ 94 Tier-3 active/i)).toBeInTheDocument();

    // 2. Channel Lead Flow Card
    expect(screen.getByTestId("kpi-value-lead-flow")).toHaveTextContent("3,906");
    expect(screen.getByText(/2,891 qualified \(74.0%\)/i)).toBeInTheDocument();

    // 3. Visit Conversion Card
    expect(screen.getByTestId("kpi-value-visit-conversion")).toHaveTextContent("50.9%");
    expect(screen.getByText(/1,743 of 2,010 visits completed \(86.7%\)/i)).toBeInTheDocument();

    // 4. Bookings Velocity Card
    expect(screen.getByTestId("kpi-value-bookings-velocity")).toHaveTextContent("454 Units");
    expect(screen.getByText(/29.9% visit close • ₹438.5 Cr/i)).toBeInTheDocument();

    // 5. Partner Tier Breakdown
    expect(screen.getByText("Tier 1 (Elite)")).toBeInTheDocument();
    expect(screen.getByTestId("tier-count-0")).toHaveTextContent("18 partners");
    expect(screen.getByTestId("tier-pct-0")).toHaveTextContent("10.3%");

    expect(screen.getByText("Tier 2 (Growth)")).toBeInTheDocument();
    expect(screen.getByTestId("tier-count-1")).toHaveTextContent("45 partners");
    expect(screen.getByTestId("tier-pct-1")).toHaveTextContent("25.7%");

    expect(screen.getByText("Tier 3 (Active)")).toBeInTheDocument();
    expect(screen.getByTestId("tier-count-2")).toHaveTextContent("112 partners");
    expect(screen.getByTestId("tier-pct-2")).toHaveTextContent("64.0%");

    // 6. Recent Activity Table
    expect(screen.getByText("Apex Real Estate Advisors")).toBeInTheDocument();
    expect(screen.getByText("Booking confirmed for Rajesh Kale.")).toBeInTheDocument();
    expect(screen.getByText("Horizon Property Consultants")).toBeInTheDocument();
    expect(screen.getByText("Site visit completed for Siddharth More.")).toBeInTheDocument();

    // 7. Attention Alerts
    expect(screen.getByText("Low Inventory: Solaris Residences")).toBeInTheDocument();
    expect(
      screen.getByText("Solaris Residences has only 12 units (2.7%) remaining in sales inventory.")
    ).toBeInTheDocument();
  });

  it("renders bounded-height activity viewport with fixed header and preserved View Log action", () => {
    const multiRowActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `act-${i + 1}`,
      partner_name: `Partner Agency ${i + 1}`,
      action: `Lead submitted for Project ${i + 1}`,
      logged_at: `2026-12-${20 + (i % 10)}T10:00:00Z`,
      time_ago: `${i + 1}h ago`,
      status: "info" as const,
      tag: "Lead Batch",
    }));

    const extendedData = {
      ...MOCK_OVERVIEW_DATA,
      recent_activities: multiRowActivities,
    };

    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: extendedData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OverviewView />);

    // 1. Verify Card and View Log action
    const card = screen.getByTestId("card-recent-activity");
    expect(card).toBeInTheDocument();
    const viewLogBtn = screen.getByRole("button", { name: /View Log/i });
    expect(viewLogBtn).toBeInTheDocument();

    // 2. Verify Viewport Container structure & bounded scroll properties
    const viewport = screen.getByTestId("recent-activity-viewport");
    expect(viewport).toBeInTheDocument();
    expect(viewport.className).toContain("overflow-y-auto");
    expect(viewport.className).toContain("max-h-");

    // 3. Verify all 10 activity rows are mounted inside viewport
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`activity-row-act-${i}`)).toBeInTheDocument();
      expect(screen.getByText(`Partner Agency ${i}`)).toBeInTheDocument();
    }
  });
});
