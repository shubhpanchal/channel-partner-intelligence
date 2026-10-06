import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProjects, fetchProjectById } from "@/lib/api/projects";

describe("Projects API Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches projects directory with default parameters", async () => {
    const mockResponse = {
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await fetchProjects();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/projects"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result.items.length).toBe(1);
    expect(result.pagination.total).toBe(4);
    expect(result.portfolio_summary.total_projects).toBe(4);
    expect(result.portfolio_summary.total_target_units).toBe(1250);
  });

  it("appends query filters correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        pagination: { total: 0, page: 2, page_size: 10, total_pages: 0 },
        portfolio_summary: {
          total_projects: 0,
          total_families: 0,
          total_target_units: 0,
          total_available_units: 0,
          total_booked_units: 0,
          total_booking_value_inr: 0,
        },
      }),
    } as any);

    await fetchProjects({
      page: 2,
      pageSize: 10,
      family: "Skyfinia",
      status: "Active",
      search: "Phase 1",
      sortBy: "target_units",
    });

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("page_size=10");
    expect(calledUrl).toContain("family=Skyfinia");
    expect(calledUrl).toContain("status=Active");
    expect(calledUrl).toContain("search=Phase+1");
    expect(calledUrl).toContain("sort_by=target_units");
  });

  it("handles fetch failure gracefully for list", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "Database connection failed" }),
    } as any);

    await expect(fetchProjects()).rejects.toThrow("Database connection failed");
  });

  it("fetches single project detail by ID", async () => {
    const mockDetail = {
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
    } as any);

    const result = await fetchProjectById("prj-sky-p1");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/projects/prj-sky-p1"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result.id).toBe("prj-sky-p1");
    expect(result.name).toBe("Skyfinia Phase 1");
    expect(result.project_family).toBe("Skyfinia");
  });

  it("handles 404 project not found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ detail: "Project non-existent-id not found" }),
    } as any);

    await expect(fetchProjectById("non-existent-id")).rejects.toThrow("Project non-existent-id not found");
  });
});
