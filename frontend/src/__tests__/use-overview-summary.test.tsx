import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOverviewSummary, OVERVIEW_SUMMARY_QUERY_KEY } from "@/hooks/use-overview-summary";
import * as overviewApi from "@/lib/api/overview";

const MOCK_RESPONSE: overviewApi.OverviewSummaryResponse = {
  kpis: {
    active_partners: { value: 152, growth_pct: null, breakdown: { tier_1: 18, tier_2: 40, tier_3: 94 } },
    channel_lead_flow: { value: 3906, total_leads: 4018, valid_leads: 3906, qualified_leads: 2891, qualification_rate_pct: 74.01, growth_pct: null },
    site_visits: { total_scheduled: 2010, total_completed: 1743, visit_completion_rate_pct: 86.72, unique_visited_leads: 1472, qualified_lead_to_visit_rate_pct: 50.92, growth_pct: null },
    bookings_velocity: { units_count: 454, confirmed_bookings: 454, confirmed_from_visited_leads: 440, direct_confirmed_bookings: 14, total_value_inr: 4385100000.0, visit_to_booking_rate_pct: 29.89, overall_conversion_rate_pct: 11.62, growth_pct: null },
  },
  tier_breakdown: [],
  monthly_trends: [],
  recent_activities: [],
  attention_alerts: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return TestWrapper;
}

describe("useOverviewSummary hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports query key constant", () => {
    expect(OVERVIEW_SUMMARY_QUERY_KEY).toBe("overview-summary");
  });

  it("fetches overview summary successfully", async () => {
    vi.spyOn(overviewApi, "fetchOverviewSummary").mockResolvedValue(MOCK_RESPONSE);

    const { result } = renderHook(() => useOverviewSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_RESPONSE);
    expect(overviewApi.fetchOverviewSummary).toHaveBeenCalledWith(undefined);
  });

  it("passes filter parameters to fetchOverviewSummary", async () => {
    vi.spyOn(overviewApi, "fetchOverviewSummary").mockResolvedValue(MOCK_RESPONSE);

    const filters: overviewApi.OverviewSummaryFilters = {
      start_date: "2026-01-01",
      end_date: "2026-06-30",
      project_id: "prj-101",
    };

    const { result } = renderHook(() => useOverviewSummary(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(overviewApi.fetchOverviewSummary).toHaveBeenCalledWith(filters);
  });
});
