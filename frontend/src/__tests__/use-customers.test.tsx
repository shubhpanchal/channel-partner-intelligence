import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCustomerSearch,
  useCustomerDetail,
  CUSTOMER_SEARCH_QUERY_KEY,
  CUSTOMER_DETAIL_QUERY_KEY,
} from "@/hooks/use-customers";
import * as customersApi from "@/lib/api/customers";

const MOCK_SEARCH_RESPONSE: customersApi.CustomerSearchResponse = {
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

const MOCK_DETAIL_RESPONSE: customersApi.CustomerDetailResponse = {
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
  channel_partner_tier: "Platinum",
  salesperson_id: "sp-101",
  salesperson_name: "Rohit Deshmukh",
  created_at: "2026-10-10T10:00:00Z",
  site_visits: [],
  bookings: [
    {
      id: "bk-000014",
      booking_reference: "BK-2026-000014",
      unit_number: "Unit 773",
      unit_type: "3 BHK Luxury",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      booking_date: "2026-11-17",
      booking_status: "Cancelled",
      booking_value: 18500000.0,
      token_amount: 100000.0,
      commission_rate_pct: 2.0,
      commission_amount: 370000.0,
      cancelled_at: "2026-11-19T09:54:32Z",
      created_at: "2026-11-17T08:48:05Z",
    },
    {
      id: "bk-000015",
      booking_reference: "BK-2026-000015",
      unit_number: "Unit 1706",
      unit_type: "3 BHK Luxury",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      booking_date: "2026-11-22",
      booking_status: "Confirmed",
      booking_value: 18500000.0,
      token_amount: 100000.0,
      commission_rate_pct: 2.0,
      commission_amount: 370000.0,
      cancelled_at: null,
      created_at: "2026-11-22T21:01:31Z",
    },
  ],
  lifecycle_events: [],
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

describe("useCustomers hooks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports query key constants", () => {
    expect(CUSTOMER_SEARCH_QUERY_KEY).toBe("customer-search");
    expect(CUSTOMER_DETAIL_QUERY_KEY).toBe("customer-detail");
  });

  it("searches customers when query is valid", async () => {
    vi.spyOn(customersApi, "searchCustomers").mockResolvedValue(MOCK_SEARCH_RESPONSE);

    const { result } = renderHook(() => useCustomerSearch("Aarav", 10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_SEARCH_RESPONSE);
  });

  it("does not search customers when query length is less than 2", () => {
    const searchSpy = vi.spyOn(customersApi, "searchCustomers");

    const { result } = renderHook(() => useCustomerSearch("A"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it("fetches customer detail when leadId is provided", async () => {
    vi.spyOn(customersApi, "fetchCustomerById").mockResolvedValue(MOCK_DETAIL_RESPONSE);

    const { result } = renderHook(() => useCustomerDetail("ld-000067"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_DETAIL_RESPONSE);
  });

  it("does not fetch customer detail when leadId is empty", () => {
    const detailSpy = vi.spyOn(customersApi, "fetchCustomerById");

    const { result } = renderHook(() => useCustomerDetail(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(detailSpy).not.toHaveBeenCalled();
  });
});
