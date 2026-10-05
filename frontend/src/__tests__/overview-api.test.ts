import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchOverviewSummary } from "@/lib/api/overview";
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/utils";

describe("Overview API Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches overview summary with no filters", async () => {
    const mockResponseData = {
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponseData,
    } as any);

    const result = await fetchOverviewSummary();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/overview/summary"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result.kpis.active_partners.value).toBe(152);
  });

  it("appends query parameters when filters are provided", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any);

    await fetchOverviewSummary({
      start_date: "2026-01-01",
      end_date: "2026-06-30",
      project_id: "prj-101",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("start_date=2026-01-01&end_date=2026-06-30&project_id=prj-101"),
      expect.any(Object)
    );
  });

  it("throws descriptive error when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ detail: "start_date cannot be greater than end_date." }),
    } as any);

    await expect(
      fetchOverviewSummary({
        start_date: "2026-12-31",
        end_date: "2026-01-01",
      })
    ).rejects.toThrow("start_date cannot be greater than end_date.");
  });

  it("handles non-JSON error responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as any);

    await expect(fetchOverviewSummary()).rejects.toThrow(
      "Failed to fetch overview summary (500 Internal Server Error)"
    );
  });
});

describe("Formatting Utilities", () => {
  it("formats Indian currency in standard crore / lakh shorthand", () => {
    expect(formatCurrencyInr(0)).toBe("₹0");
    expect(formatCurrencyInr(4385100000)).toBe("₹438.5 Cr");
    expect(formatCurrencyInr(13500000)).toBe("₹1.35 Cr");
    expect(formatCurrencyInr(8500000)).toBe("₹85.0 L");
    expect(formatCurrencyInr(45000)).toBe("₹45,000");
  });

  it("formats numbers with Indian comma grouping", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(3906)).toBe("3,906");
    expect(formatNumber(1472)).toBe("1,472");
    expect(formatNumber(undefined as any)).toBe("0");
  });

  it("formats percentages with precision", () => {
    expect(formatPercent(74.01, 1)).toBe("74.0%");
    expect(formatPercent(74.01, 2)).toBe("74.01%");
    expect(formatPercent(undefined as any)).toBe("0.0%");
  });
});
