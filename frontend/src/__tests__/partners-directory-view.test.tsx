import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PartnersDirectoryView } from "@/components/partners/partners-directory-view";
import * as partnersHook from "@/hooks/use-partners";
import { PartnerListResponse } from "@/lib/api/partners";

const MOCK_LIST_DATA: PartnerListResponse = {
  items: [
    {
      id: "cp-1001",
      partner_code: "CP-1001",
      name: "Apex Realty",
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
    {
      id: "cp-1002",
      partner_code: "CP-1002",
      name: "Bluechip Properties",
      contact_person: "Anjali Mehta",
      phone: "+91 98200 22222",
      email: "anjali@bluechip.com",
      city: "Mumbai",
      location: "Bandra",
      onboarding_date: "2026-01-12",
      active: false,
      tier: "Tier 2",
      channel_type: "Boutique Firm",
      assigned_salesperson: null,
      summary_stats: {
        total_leads: 20,
        qualified_leads: 10,
        completed_visits: 8,
        confirmed_bookings: 2,
        visit_to_booking_rate_pct: 25.0,
        overall_conversion_rate_pct: 10.0,
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

describe("PartnersDirectoryView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading skeleton state when loading", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state when request fails and allows retry", () => {
    const refetchMock = vi.fn();
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load partners"),
      refetch: refetchMock,
    } as any);

    render(<PartnersDirectoryView />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Failed to load partners")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when items array is empty", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: {
        items: [],
        pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No partners match these filters")).toBeInTheDocument();
  });

  it("renders partners directory table with formatted stats", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    expect(screen.getAllByText("Apex Realty").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CP-1001").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bluechip Properties").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CP-1002").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Total Partners: 175")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 9")).toBeInTheDocument();
  });

  it("triggers filter changes and debounces search input", async () => {
    const usePartnersSpy = vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    const searchInput = screen.getByTestId("partners-search-input");
    fireEvent.change(searchInput, { target: { value: "Apex" } });

    const tierSelect = screen.getByTestId("partners-tier-filter");
    fireEvent.change(tierSelect, { target: { value: "Tier 1" } });

    const statusSelect = screen.getByTestId("partners-status-filter");
    fireEvent.change(statusSelect, { target: { value: "true" } });

    const citySelect = screen.getByTestId("partners-city-filter");
    fireEvent.change(citySelect, { target: { value: "Pune" } });

    const sortSelect = screen.getByTestId("partners-sort-by");
    fireEvent.change(sortSelect, { target: { value: "onboarding_date" } });

    await waitFor(() => {
      expect(usePartnersSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: "Tier 1",
          active: true,
          city: "Pune",
          sort_by: "onboarding_date",
        })
      );
    });
  });

  it("clears filters when clear filters button is clicked", async () => {
    const usePartnersSpy = vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    const tierSelect = screen.getByTestId("partners-tier-filter");
    fireEvent.change(tierSelect, { target: { value: "Tier 1" } });

    const clearBtn = await screen.findByTestId("clear-filters-btn");
    fireEvent.click(clearBtn);

    expect(tierSelect).toHaveValue("");
  });

  it("opens PartnerDetailView when a partner row is clicked", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(partnersHook, "usePartnerDetail").mockReturnValue({
      data: {
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
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    const row = screen.getByTestId("partner-row-cp-1001");
    fireEvent.click(row);

    // Should now show partner detail view
    expect(screen.getByTestId("back-to-directory-btn")).toBeInTheDocument();
    expect(screen.getByTestId("detail-total-leads")).toHaveTextContent("50");

    // Clicking back button should return to directory
    const backBtn = screen.getByTestId("back-to-directory-btn");
    fireEvent.click(backBtn);

    expect(screen.getByTestId("partners-search-input")).toBeInTheDocument();
  });
});
