import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PartnerDetailView } from "@/components/partners/partner-detail-view";
import * as partnersHook from "@/hooks/use-partners";
import { PartnerDetailResponse } from "@/lib/api/partners";

const MOCK_PARTNER_DETAIL: PartnerDetailResponse = {
  id: "cp-1001",
  partner_code: "CP-1001",
  name: "Apex Realty Consultants",
  legal_name: "Apex Real Estate Services Pvt Ltd",
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
    name: "Rahul Sharma",
    email: "rahul@developer.com",
    phone: "+91 98200 00001",
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
  recent_leads: [
    {
      id: "ld-101",
      lead_code: "LD-2026-0001",
      customer_name: "Suresh Gupta",
      customer_phone: "+91 98111 22222",
      project_id: "prj-101",
      project_name: "Godrej Infinity",
      status: "Qualified",
      created_at: "2026-02-10T10:00:00Z",
      qualified_at: "2026-02-11T12:00:00Z",
    },
  ],
  recent_bookings: [
    {
      id: "bk-101",
      booking_reference: "BK-2026-0001",
      lead_id: "ld-101",
      customer_name: "Suresh Gupta",
      project_id: "prj-101",
      project_name: "Godrej Infinity",
      unit_number: "T2-1404",
      unit_type: "3BHK",
      booking_date: "2026-03-01",
      booking_status: "Confirmed",
      booking_value: 15000000.0,
      token_amount: 500000.0,
      commission_rate_pct: 2.5,
      commission_amount: 375000.0,
      salesperson_name: "Rahul Sharma",
      created_at: "2026-03-01T15:00:00Z",
    },
  ],
};

describe("PartnerDetailView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state when query is loading", () => {
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={vi.fn()} />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state when query fails and triggers retry", () => {
    const refetchMock = vi.fn();
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network timeout"),
      refetch: refetchMock,
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={vi.fn()} />);

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders partner profile header and assigned salesperson", () => {
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: MOCK_PARTNER_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={vi.fn()} />);

    expect(screen.getByText("Apex Realty Consultants")).toBeInTheDocument();
    expect(screen.getByText("CP-1001")).toBeInTheDocument();
    expect(screen.getByText("Tier 1")).toBeInTheDocument();
    expect(screen.getByText("Active Account")).toBeInTheDocument();
    expect(screen.getByText("Baner, Pune")).toBeInTheDocument();
    expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
  });

  it("renders performance metrics cards with correct formatting", () => {
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: MOCK_PARTNER_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={vi.fn()} />);

    expect(screen.getByTestId("detail-total-leads")).toHaveTextContent("50");
    expect(screen.getByTestId("detail-qualified-leads")).toHaveTextContent("35");
    expect(screen.getByTestId("detail-completed-visits")).toHaveTextContent("25");
    expect(screen.getByTestId("detail-confirmed-bookings")).toHaveTextContent("8");
    expect(screen.getByTestId("detail-visit-to-booking-rate")).toHaveTextContent("40.0%");
    expect(screen.getByTestId("detail-overall-conversion-rate")).toHaveTextContent("16.0%");
  });

  it("renders recent leads and bookings tables", () => {
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: MOCK_PARTNER_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={vi.fn()} />);

    expect(screen.getByText("LD-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("BK-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Unit T2-1404 (3BHK)")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const onBackMock = vi.fn();
    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: MOCK_PARTNER_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnerDetailView partnerId="cp-1001" onBack={onBackMock} />);

    const backBtn = screen.getByTestId("back-to-directory-btn");
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
