import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchCustomers, fetchCustomerById } from "@/lib/api/customers";

describe("Customers API client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns empty items when search query is less than 2 chars", async () => {
    global.fetch = vi.fn();
    const result = await searchCustomers("a");
    expect(result).toEqual({ items: [], total: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls /api/v1/customers/search with trimmed query and page_size", async () => {
    const mockResponse = {
      items: [
        {
          lead_id: "ld-000067",
          lead_code: "LD-2026-000067",
          customer_name: "Aarav Mehta",
          customer_phone: "+919822099901",
          customer_email: "aarav.mehta@example.com",
          project_id: "prj-sky-p1",
          project_name: "Skyfinia Phase 1",
          lead_status: "Converted",
          channel_partner_id: "cp-1001",
          channel_partner_name: "Elite Realty Partners",
          salesperson_id: "sp-101",
          salesperson_name: "Rohit Deshmukh",
        },
      ],
      total: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await searchCustomers("  Aarav  ", 5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/customers/search?q=Aarav&page_size=5"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockResponse);
  });

  it("calls /api/v1/customers/{lead_id} for detail", async () => {
    const mockDetail = {
      lead_id: "ld-000067",
      lead_code: "LD-2026-000067",
      customer_name: "Aarav Mehta",
      customer_phone: "+919822099901",
      customer_email: "aarav.mehta@example.com",
      lead_status: "Converted",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      channel_partner_id: "cp-1001",
      channel_partner_name: "Elite Realty Partners",
      created_at: "2026-01-10T10:00:00Z",
      site_visits: [],
      bookings: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
    } as any);

    const result = await fetchCustomerById("ld-000067");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/customers/ld-000067"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockDetail);
  });

  it("throws error when leadId is empty in fetchCustomerById", async () => {
    await expect(fetchCustomerById("")).rejects.toThrow("leadId is required");
  });

  it("throws error when search API returns non-200 error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "Database search error" }),
    } as any);

    await expect(searchCustomers("Aarav")).rejects.toThrow("Database search error");
  });
});
