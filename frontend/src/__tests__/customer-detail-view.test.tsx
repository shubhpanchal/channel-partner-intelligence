import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import * as customersApi from "@/lib/api/customers";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const MOCK_AARAV_DETAIL: customersApi.CustomerDetailResponse = {
  lead_id: "ld-000067",
  lead_code: "LD-2026-000067",
  customer_name: "Aarav Mehta",
  customer_phone: "+919822099901",
  customer_email: "aarav.mehta@example.com",
  lead_status: "Converted",
  budget_range: "₹1.5 Cr - ₹2.0 Cr",
  requirement_type: "3 BHK Luxury",
  lost_reason: null,
  created_at: "2026-10-15T10:00:00Z",
  qualified_at: "2026-10-18T14:30:00Z",
  converted_at: "2026-11-22T21:01:31Z",
  lost_at: null,
  project_id: "prj-sky-p1",
  project_name: "Skyfinia Phase 1",
  channel_partner_id: "cp-1001",
  channel_partner_name: "Elite Realty Partners",
  channel_partner_code: "CP-1001",
  channel_partner_tier: "Platinum",
  salesperson_id: "sp-101",
  salesperson_name: "Rohit Deshmukh",
  salesperson_email: "rohit.deshmukh@harivishva.com",
  salesperson_phone: "+91 98220 11001",
  site_visits: [
    {
      id: "sv-0001",
      visit_code: "SV-2026-000045",
      scheduled_at: "2026-10-25T11:00:00Z",
      visited_at: "2026-10-25T11:30:00Z",
      status: "Completed",
      verification_type: "Geo-Fence OTP",
      outcome: "Positive",
      feedback_notes: "Liked the sample flat",
      created_at: "2026-10-20T09:00:00Z",
    },
  ],
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
  lifecycle_events: [
    {
      event_id: "bk-000014-created",
      event_type: "BOOKING_CREATED",
      event_at: "2026-11-17T08:48:05Z",
      booking_id: "bk-000014",
      booking_reference: "BK-2026-000014",
      unit_number: "Unit 773",
      unit_type: "3 BHK Luxury",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      booking_status: "Cancelled",
      booking_value: 18500000.0,
      is_replacement: false,
      description: "Booking attempted for Unit 773 (3 BHK Luxury)",
    },
    {
      event_id: "bk-000014-cancelled",
      event_type: "BOOKING_CANCELLED",
      event_at: "2026-11-19T09:54:32Z",
      booking_id: "bk-000014",
      booking_reference: "BK-2026-000014",
      unit_number: "Unit 773",
      unit_type: "3 BHK Luxury",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      booking_status: "Cancelled",
      booking_value: 18500000.0,
      is_replacement: false,
      description: "Booking cancelled for Unit 773 (3 BHK Luxury)",
    },
    {
      event_id: "bk-000015-created",
      event_type: "BOOKING_CONFIRMED",
      event_at: "2026-11-22T21:01:31Z",
      booking_id: "bk-000015",
      booking_reference: "BK-2026-000015",
      unit_number: "Unit 1706",
      unit_type: "3 BHK Luxury",
      project_id: "prj-sky-p1",
      project_name: "Skyfinia Phase 1",
      booking_status: "Confirmed",
      booking_value: 18500000.0,
      is_replacement: true,
      description: "Replacement booking confirmed for Unit 1706 (3 BHK Luxury)",
    },
  ],
};

function renderCustomerDetail(leadId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomerDetailView leadId={leadId} />
    </QueryClientProvider>
  );
}

describe("CustomerDetailView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it("renders loading state initially", () => {
    vi.spyOn(customersApi, "fetchCustomerById").mockReturnValue(new Promise(() => {}));
    renderCustomerDetail("ld-000067");
    expect(screen.getByTestId("customer-detail-loading")).toBeInTheDocument();
  });

  it("renders error state on API failure", async () => {
    vi.spyOn(customersApi, "fetchCustomerById").mockRejectedValue(new Error("Lead not found"));
    renderCustomerDetail("ld-invalid");

    await waitFor(() => {
      expect(screen.getByTestId("customer-detail-error")).toBeInTheDocument();
      expect(screen.getByText("Customer Profile Not Found")).toBeInTheDocument();
    });
  });

  it("renders full customer details, attribution, site visits, and three-event booking replacement lifecycle", async () => {
    vi.spyOn(customersApi, "fetchCustomerById").mockResolvedValue(MOCK_AARAV_DETAIL);
    renderCustomerDetail("ld-000067");

    await waitFor(() => {
      expect(screen.getByTestId("customer-name-heading")).toHaveTextContent("Aarav Mehta");
      expect(screen.getByText("LD-2026-000067")).toBeInTheDocument();
      expect(screen.getByText("+919822099901")).toBeInTheDocument();
      expect(screen.getByText("aarav.mehta@example.com")).toBeInTheDocument();
      expect(screen.getAllByText("3 BHK Luxury").length).toBeGreaterThanOrEqual(1);
    });

    // Attribution cards
    expect(screen.getAllByText("Skyfinia Phase 1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Elite Realty Partners")).toBeInTheDocument();
    expect(screen.getByText("Rohit Deshmukh")).toBeInTheDocument();
    expect(screen.getByText("rohit.deshmukh@harivishva.com")).toBeInTheDocument();

    // Site visit table
    expect(screen.getByTestId("site-visit-history-card")).toBeInTheDocument();
    expect(screen.getByText("SV-2026-000045")).toBeInTheDocument();
    expect(screen.getByText("Liked the sample flat")).toBeInTheDocument();

    // Booking replacement lifecycle container & badge
    expect(screen.getByTestId("booking-history-card")).toBeInTheDocument();
    expect(screen.getByTestId("replacement-lifecycle-badge")).toBeInTheDocument();
    expect(screen.getByText(/Unit Replacement Lifecycle Detected/)).toBeInTheDocument();

    // Three-Event Timeline Verification (Issue #12)
    expect(screen.getByTestId("lifecycle-events-timeline")).toBeInTheDocument();
    expect(screen.getByText("Booking Attempted")).toBeInTheDocument();
    expect(screen.getByText("Booking Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Replacement Booking Confirmed")).toBeInTheDocument();

    // Step indicators
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();

    // Both units visible across events and table
    expect(screen.getAllByText("Unit 773").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Unit 1706").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("BK-2026-000014").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("BK-2026-000015").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Cancellation recorded")).toBeInTheDocument();

    // Raw Bookings Table
    expect(screen.getByText(/Raw Booking Records \(2\)/)).toBeInTheDocument();

    // Navigation back
    const backBtn = screen.getByTestId("back-to-dashboard-btn");
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith("/");

    // Navigation to partner
    const partnerBtn = screen.getByTestId("view-partner-profile-btn");
    fireEvent.click(partnerBtn);
    expect(mockPush).toHaveBeenCalledWith("/?section=partners&partnerId=cp-1001");
  });
});
