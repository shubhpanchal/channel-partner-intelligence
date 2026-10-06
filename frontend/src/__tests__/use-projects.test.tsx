import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useProjects,
  useProjectDetail,
  PROJECTS_DIRECTORY_QUERY_KEY,
  PROJECT_DETAIL_QUERY_KEY,
} from "@/hooks/use-projects";
import * as projectsApi from "@/lib/api/projects";

const MOCK_LIST_RESPONSE: projectsApi.ProjectListResponse = {
  items: [
    {
      id: "prj-sky-p1",
      project_code: "prj-sky-p1",
      name: "Skyfinia Phase 1",
      project_family: "Skyfinia",
      project_type: "Residential High-Rise",
      location: "Tathawade",
      city: "Pune",
      status: "Active",
      launch_date: "2026-01-01",
      target_units: 320,
      available_units: 280,
      starting_price: 8800000.0,
      metrics: {
        target_units: 320,
        available_units: 280,
        booked_units: 40,
        inventory_utilization_pct: 12.5,
        total_leads: 180,
        valid_leads: 175,
        qualified_leads: 130,
        qualification_rate_pct: 74.29,
        completed_visits: 85,
        confirmed_bookings: 40,
        gross_booking_value_inr: 400000000.0,
        overall_conversion_rate_pct: 22.86,
      },
    },
  ],
  pagination: {
    total: 4,
    page: 1,
    page_size: 20,
    total_pages: 1,
  },
  portfolio_summary: {
    total_projects: 4,
    total_families: 2,
    total_target_units: 1250,
    total_available_units: 1092,
    total_booked_units: 158,
    total_booking_value_inr: 1583400000.0,
  },
};

const MOCK_DETAIL_RESPONSE: projectsApi.ProjectDetailResponse = {
  id: "prj-sky-p1",
  project_code: "prj-sky-p1",
  name: "Skyfinia Phase 1",
  project_family: "Skyfinia",
  project_type: "Residential High-Rise",
  location: "Tathawade",
  city: "Pune",
  status: "Active",
  launch_date: "2026-01-01",
  target_units: 320,
  available_units: 280,
  starting_price: 8800000.0,
  inventory: {
    target_units: 320,
    available_units: 280,
    booked_units: 40,
    inventory_utilization_pct: 12.5,
  },
  lead_metrics: {
    total_leads: 180,
    valid_leads: 175,
    qualified_leads: 130,
    qualification_rate_pct: 74.29,
  },
  site_visit_metrics: {
    scheduled_visits: 95,
    completed_visits: 85,
    visit_completion_rate_pct: 89.47,
    unique_visited_leads: 78,
    qualified_lead_to_visit_rate_pct: 60.0,
  },
  booking_metrics: {
    confirmed_bookings: 40,
    confirmed_from_visited_leads: 39,
    direct_confirmed_bookings: 1,
    visit_to_booking_rate_pct: 50.0,
    overall_lead_to_booking_rate_pct: 22.86,
    gross_booking_value_inr: 400000000.0,
  },
  partner_metrics: {
    contributing_lead_partners: 25,
    contributing_booking_partners: 15,
  },
  monthly_trends: [],
  top_partners: [],
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

describe("useProjects Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches projects directory successfully", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue(MOCK_LIST_RESPONSE);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items.length).toBe(1);
    expect(result.current.data?.pagination.total).toBe(4);
    expect(result.current.data?.portfolio_summary.total_projects).toBe(4);
  });

  it("passes filter parameters to fetchProjects", async () => {
    const fetchSpy = vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue(MOCK_LIST_RESPONSE);

    const filters: projectsApi.ProjectFilters = {
      page: 2,
      pageSize: 10,
      family: "Skyfinia",
      status: "Active",
      search: "Skyfinia",
      sortBy: "target_units",
    };

    const { result } = renderHook(() => useProjects(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchSpy).toHaveBeenCalledWith(filters);
  });

  it("handles fetchProjects error state", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockRejectedValue(new Error("API network failure"));

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("API network failure");
  });
});

describe("useProjectDetail Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches single project detail successfully", async () => {
    vi.spyOn(projectsApi, "fetchProjectById").mockResolvedValue(MOCK_DETAIL_RESPONSE);

    const { result } = renderHook(() => useProjectDetail("prj-sky-p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("prj-sky-p1");
    expect(result.current.data?.name).toBe("Skyfinia Phase 1");
  });

  it("does not trigger fetch when projectId is empty", async () => {
    const fetchSpy = vi.spyOn(projectsApi, "fetchProjectById").mockResolvedValue(MOCK_DETAIL_RESPONSE);

    const { result } = renderHook(() => useProjectDetail(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
