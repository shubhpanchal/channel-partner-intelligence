import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  usePartners,
  usePartnerDetail,
  PARTNERS_DIRECTORY_QUERY_KEY,
  PARTNER_DETAIL_QUERY_KEY,
} from "@/hooks/use-partners";
import * as partnersApi from "@/lib/api/partners";

const MOCK_LIST_RESPONSE: partnersApi.PartnerListResponse = {
  items: [
    {
      id: "cp-1001",
      partner_code: "CP-1001",
      name: "Apex Realty",
      contact_person: "Vikram Malhotra",
      phone: "+91 98200 11111",
      email: "vikram@apexrealty.com",
      city: "Pune",
      location: "Baner",
      onboarding_date: "2026-01-10",
      active: true,
      tier: "Tier 1",
      channel_type: "Corporate Agency",
      assigned_salesperson: { id: "sp-101", name: "Rohit Deshmukh" },
      summary_stats: {
        total_leads: 50,
        qualified_leads: 35,
        completed_visits: 25,
        confirmed_bookings: 8,
        visit_to_booking_rate_pct: 32.0,
        overall_conversion_rate_pct: 16.0,
      },
    },
  ],
  pagination: {
    total: 36,
    page: 1,
    page_size: 20,
    total_pages: 2,
  },
};

const MOCK_DETAIL_RESPONSE: partnersApi.PartnerDetailResponse = {
  id: "cp-1001",
  partner_code: "CP-1001",
  name: "Apex Realty",
  contact_person: "Vikram Malhotra",
  phone: "+91 98200 11111",
  email: "vikram@apexrealty.com",
  city: "Pune",
  location: "Baner",
  onboarding_date: "2026-01-10",
  active: true,
  tier: "Tier 1",
  channel_type: "Corporate Agency",
  assigned_salesperson: {
    id: "sp-101",
    name: "Rohit Deshmukh",
    email: "rohit.deshmukh@harivishva.com",
    phone: "+91 98220 11001",
  },
  metrics: {
    total_leads: 50,
    qualified_leads: 35,
    qualification_rate_pct: 70.0,
    scheduled_site_visits: 30,
    completed_site_visits: 25,
    visit_completion_rate_pct: 83.33,
    unique_visited_leads: 20,
    qualified_lead_to_visit_rate_pct: 57.14,
    confirmed_bookings: 8,
    visit_to_booking_rate_pct: 40.0,
    overall_conversion_rate_pct: 16.0,
    gross_booking_value_inr: 85000000.0,
  },
  monthly_trends: [],
  project_contribution: [],
  recent_leads: [],
  recent_bookings: [],
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

describe("usePartners hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports query key constants", () => {
    expect(PARTNERS_DIRECTORY_QUERY_KEY).toBe("partners-directory");
    expect(PARTNER_DETAIL_QUERY_KEY).toBe("partner-detail");
  });

  it("fetches partners list successfully", async () => {
    vi.spyOn(partnersApi, "fetchPartners").mockResolvedValue(MOCK_LIST_RESPONSE);

    const { result } = renderHook(() => usePartners({ page: 1, page_size: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_LIST_RESPONSE);
  });

  it("fetches partner detail successfully when partnerId is provided", async () => {
    vi.spyOn(partnersApi, "fetchPartnerById").mockResolvedValue(MOCK_DETAIL_RESPONSE);

    const { result } = renderHook(() => usePartnerDetail("cp-1001"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_DETAIL_RESPONSE);
  });

  it("does not fetch partner detail when partnerId is null", () => {
    const fetchSpy = vi.spyOn(partnersApi, "fetchPartnerById");

    const { result } = renderHook(() => usePartnerDetail(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
