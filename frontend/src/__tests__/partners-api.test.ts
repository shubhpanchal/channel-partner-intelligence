import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPartners, fetchPartnerById } from "@/lib/api/partners";

describe("Partners API Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches partners directory with default parameters", async () => {
    const mockResponse = {
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
          assigned_salesperson: { id: "sp-101", name: "Rahul Sharma" },
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
        total: 175,
        page: 1,
        page_size: 20,
        total_pages: 9,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await fetchPartners();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/partners"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result.items.length).toBe(1);
    expect(result.pagination.total).toBe(175);
  });

  it("appends query filters correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], pagination: { total: 0, page: 2, page_size: 50, total_pages: 0 } }),
    } as any);

    await fetchPartners({
      page: 2,
      page_size: 50,
      tier: "Tier 1",
      active: true,
      city: "Pune",
      search: "Apex",
      sort_by: "name",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2&page_size=50&tier=Tier+1&active=true&city=Pune&search=Apex&sort_by=name"),
      expect.any(Object)
    );
  });

  it("throws error when partner directory fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "Database connection failed" }),
    } as any);

    await expect(fetchPartners()).rejects.toThrow("Database connection failed");
  });

  it("fetches partner detail by ID successfully", async () => {
    const mockDetail = {
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
      recent_leads: [],
      recent_bookings: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
    } as any);

    const result = await fetchPartnerById("cp-1001");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/partners/cp-1001"),
      expect.any(Object)
    );
    expect(result.id).toBe("cp-1001");
    expect(result.metrics.gross_booking_value_inr).toBe(85000000.0);
  });

  it("throws error when partner detail by ID returns 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ detail: "Channel Partner with ID 'cp-999' was not found." }),
    } as any);

    await expect(fetchPartnerById("cp-999")).rejects.toThrow("Channel Partner with ID 'cp-999' was not found.");
  });
});
