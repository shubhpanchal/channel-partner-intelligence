import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PartnersDirectoryView } from "@/components/partners/partners-directory-view";
import * as partnersHook from "@/hooks/use-partners";
import * as overviewHook from "@/hooks/use-overview-summary";
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
    vi.spyOn(overviewHook, "useOverviewSummary").mockReturnValue({
      data: {
        kpis: {
          active_partners: { value: 172, growth_pct: 0, breakdown: { tier_1: 18, tier_2: 44, tier_3: 110 } },
        },
        partner_tier_distribution: [
          { tier: "Tier 1 (Elite)", partners_count: 18, percentage: 10.3, contribution: "10.3%" },
          { tier: "Tier 2 (Growth)", partners_count: 45, percentage: 25.7, contribution: "25.7%" },
          { tier: "Tier 3 (Active)", partners_count: 112, percentage: 64.0, contribution: "64.0%" },
        ],
      } as any,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
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

  it("renders portfolio summary bar and cards view by default", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    expect(screen.getByTestId("portfolio-summary-bar")).toBeInTheDocument();
    expect(screen.getByTestId("summary-total-partners")).toBeInTheDocument();
    expect(screen.getByTestId("summary-active-partners")).toBeInTheDocument();

    // Default view is cards grid
    expect(screen.getByTestId("partners-cards-grid")).toBeInTheDocument();
    expect(screen.getByTestId("partner-card-cp-1001")).toBeInTheDocument();
    expect(screen.getByTestId("partner-card-cp-1002")).toBeInTheDocument();
    expect(screen.getAllByText("Apex Realty").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bluechip Properties").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Page 1 of 9")).toBeInTheDocument();
  });

  it("toggles between Cards and List view modes", () => {
    vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    // Initially cards view
    expect(screen.getByTestId("partners-cards-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("partners-table-card")).not.toBeInTheDocument();

    // Switch to List view
    const listBtn = screen.getByTestId("view-mode-list-btn");
    fireEvent.click(listBtn);

    expect(screen.getByTestId("partners-table-card")).toBeInTheDocument();
    expect(screen.queryByTestId("partners-cards-grid")).not.toBeInTheDocument();

    // Switch back to Cards view
    const cardsBtn = screen.getByTestId("view-mode-cards-btn");
    fireEvent.click(cardsBtn);

    expect(screen.getByTestId("partners-cards-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("partners-table-card")).not.toBeInTheDocument();
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

  it("opens PartnerDetailView when a partner card is clicked", () => {
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
        monthly_trends: [],
        project_contribution: [],
        recent_leads: [],
        recent_bookings: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    const card = screen.getByTestId("partner-card-cp-1001");
    fireEvent.click(card);

    // Should now show partner detail view
    expect(screen.getByTestId("back-to-directory-btn")).toBeInTheDocument();
    expect(screen.getByTestId("detail-total-leads")).toHaveTextContent("50");

    // Clicking back button should return to directory
    const backBtn = screen.getByTestId("back-to-directory-btn");
    fireEvent.click(backBtn);

    expect(screen.getByTestId("partners-search-input")).toBeInTheDocument();
  });

  it("handles pagination next and previous button clicks", () => {
    const usePartnersSpy = vi.spyOn(partnersHook, "usePartners").mockReturnValue({
      data: {
        ...MOCK_LIST_DATA,
        pagination: { total: 175, page: 2, page_size: 20, total_pages: 9 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    const prevBtn = screen.getByTestId("pagination-prev-btn");
    fireEvent.click(prevBtn);

    const nextBtn = screen.getByTestId("pagination-next-btn");
    fireEvent.click(nextBtn);

    expect(usePartnersSpy).toHaveBeenCalled();
  });

  it("opens PartnerDetailView from list mode table row", () => {
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
        monthly_trends: [],
        project_contribution: [],
        recent_leads: [],
        recent_bookings: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<PartnersDirectoryView />);

    // Switch to List view
    const listBtn = screen.getByTestId("view-mode-list-btn");
    fireEvent.click(listBtn);

    const row = screen.getByTestId("partner-row-cp-1001");
    fireEvent.click(row);

    expect(screen.getByTestId("back-to-directory-btn")).toBeInTheDocument();
  });
});
