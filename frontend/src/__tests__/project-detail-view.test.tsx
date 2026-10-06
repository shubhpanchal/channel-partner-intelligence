import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectDetailView } from "@/components/projects/project-detail-view";
import * as projectsHook from "@/hooks/use-projects";
import { ProjectDetailResponse } from "@/lib/api/projects";

const MOCK_PROJECT_DETAIL: ProjectDetailResponse = {
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
  monthly_trends: [
    { month: "Jan", leads: 15, completed_visits: 8, bookings: 3 },
    { month: "Feb", leads: 18, completed_visits: 10, bookings: 4 },
  ],
  top_partners: [
    {
      partner_id: "cp-1001",
      partner_code: "CP-1001",
      partner_name: "Apex Realty Consultants",
      tier: "Tier 1",
      assigned_salesperson_name: "Rohit Deshmukh",
      valid_leads: 25,
      completed_visits: 18,
      confirmed_bookings: 8,
      booking_value_inr: 80000000.0,
      overall_conversion_rate_pct: 32.0,
    },
  ],
  recent_bookings: [
    {
      id: "bk-101",
      booking_reference: "BK-2026-0001",
      lead_id: "ld-101",
      customer_name: "Suresh Gupta",
      channel_partner_id: "cp-1001",
      channel_partner_name: "Apex Realty Consultants",
      unit_number: "402",
      unit_type: "2 BHK",
      booking_date: "2026-02-15",
      booking_status: "Confirmed",
      booking_value: 9500000.0,
    },
  ],
};

describe("ProjectDetailView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders project header, inventory, and synthetic indicators", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
        onSelectPartner={vi.fn()}
      />
    );

    expect(screen.getByText("Skyfinia Phase 1")).toBeInTheDocument();
    expect(screen.getAllByText("Skyfinia").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Demo Environment · Synthetic Data")).toBeInTheDocument();
    expect(screen.getByText("Tathawade, Pune")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("renders the 6-KPI metrics strip accurately", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
        onSelectPartner={vi.fn()}
      />
    );

    expect(screen.getByTestId("kpi-valid-leads")).toHaveTextContent("175");
    expect(screen.getByTestId("kpi-qualified-leads")).toHaveTextContent("130");
    expect(screen.getByTestId("kpi-completed-visits")).toHaveTextContent("85");
    expect(screen.getByTestId("kpi-confirmed-bookings")).toHaveTextContent("40");
    expect(screen.getByTestId("kpi-overall-conversion")).toHaveTextContent("22.9%");
  });

  it("renders the 4-stage funnel and monthly velocity chart", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
        onSelectPartner={vi.fn()}
      />
    );

    expect(screen.getByText("Project Funnel Velocity")).toBeInTheDocument();
    expect(screen.getByText("1. Valid Leads")).toBeInTheDocument();
    expect(screen.getByText("2. Qualified Leads")).toBeInTheDocument();
    expect(screen.getByText("3. Visited Prospects")).toBeInTheDocument();
    expect(screen.getByText("4. Confirmed Bookings")).toBeInTheDocument();

    expect(screen.getByTestId("chart-project-monthly-trend")).toBeInTheDocument();
  });

  it("renders top contributing channel partners with navigation", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const onSelectPartnerMock = vi.fn();
    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
        onSelectPartner={onSelectPartnerMock}
      />
    );

    expect(screen.getByTestId("top-partners-card")).toBeInTheDocument();
    expect(screen.getAllByText("Apex Realty Consultants").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rohit Deshmukh")).toBeInTheDocument();

    const viewPartnerBtn = screen.getByTitle("View Partner Profile");
    fireEvent.click(viewPartnerBtn);
    expect(onSelectPartnerMock).toHaveBeenCalledWith("cp-1001");
  });

  it("renders recent project bookings table", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
        onSelectPartner={vi.fn()}
      />
    );

    expect(screen.getByTestId("recent-project-bookings-card")).toBeInTheDocument();
    expect(screen.getByText("BK-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Suresh Gupta")).toBeInTheDocument();
    expect(screen.getByText(/Unit 402/)).toBeInTheDocument();
  });

  it("handles back button click", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: MOCK_PROJECT_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const onBackMock = vi.fn();
    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={onBackMock}
      />
    );

    const backBtn = screen.getByTestId("back-to-projects-btn");
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it("renders loading state", () => {
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry", () => {
    const refetchMock = vi.fn();
    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Project not found in database"),
      refetch: refetchMock,
    } as any);

    render(
      <ProjectDetailView
        projectId="prj-sky-p1"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText("Unable to load project details")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });
});
