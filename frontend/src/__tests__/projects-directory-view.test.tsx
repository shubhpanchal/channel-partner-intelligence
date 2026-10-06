import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectsDirectoryView } from "@/components/projects/projects-directory-view";
import * as projectsHook from "@/hooks/use-projects";
import { ProjectListResponse } from "@/lib/api/projects";

const MOCK_LIST_DATA: ProjectListResponse = {
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
    {
      id: "prj-sky-p2",
      project_code: "prj-sky-p2",
      name: "Skyfinia Phase 2",
      project_family: "Skyfinia",
      project_type: "Residential High-Rise",
      location: "Tathawade",
      city: "Pune",
      status: "Active",
      launch_date: "2026-02-01",
      target_units: 280,
      available_units: 233,
      starting_price: 9500000.0,
      metrics: {
        target_units: 280,
        available_units: 233,
        booked_units: 47,
        inventory_utilization_pct: 16.79,
        total_leads: 190,
        valid_leads: 185,
        qualified_leads: 140,
        qualification_rate_pct: 75.68,
        completed_visits: 92,
        confirmed_bookings: 47,
        gross_booking_value_inr: 470000000.0,
        overall_conversion_rate_pct: 25.41,
      },
    },
    {
      id: "prj-inf-p1",
      project_code: "prj-inf-p1",
      name: "Infinia Phase 1",
      project_family: "Infinia",
      project_type: "Residential High-Rise",
      location: "Tathawade",
      city: "Pune",
      status: "Active",
      launch_date: "2026-01-15",
      target_units: 350,
      available_units: 317,
      starting_price: 8200000.0,
      metrics: {
        target_units: 350,
        available_units: 317,
        booked_units: 33,
        inventory_utilization_pct: 9.43,
        total_leads: 150,
        valid_leads: 145,
        qualified_leads: 110,
        qualification_rate_pct: 75.86,
        completed_visits: 70,
        confirmed_bookings: 33,
        gross_booking_value_inr: 330000000.0,
        overall_conversion_rate_pct: 22.76,
      },
    },
    {
      id: "prj-inf-p2",
      project_code: "prj-inf-p2",
      name: "Infinia Phase 2",
      project_family: "Infinia",
      project_type: "Residential High-Rise",
      location: "Tathawade",
      city: "Pune",
      status: "Active",
      launch_date: "2026-03-01",
      target_units: 300,
      available_units: 262,
      starting_price: 8900000.0,
      metrics: {
        target_units: 300,
        available_units: 262,
        booked_units: 38,
        inventory_utilization_pct: 12.67,
        total_leads: 160,
        valid_leads: 155,
        qualified_leads: 120,
        qualification_rate_pct: 77.42,
        completed_visits: 80,
        confirmed_bookings: 38,
        gross_booking_value_inr: 380000000.0,
        overall_conversion_rate_pct: 24.52,
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
    total_booking_value_inr: 1580000000.0,
  },
};

describe("ProjectsDirectoryView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders portfolio summary strip and all 4 canonical projects", () => {
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    expect(screen.getByTestId("projects-portfolio-container")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-summary-strip")).toBeInTheDocument();

    // Verify summary strip metrics
    expect(screen.getByTestId("summary-total-projects")).toHaveTextContent("4");
    expect(screen.getByTestId("summary-total-families")).toHaveTextContent("2");
    expect(screen.getByTestId("summary-target-units")).toHaveTextContent("1,250");
    expect(screen.getByTestId("summary-available-units")).toHaveTextContent("1,092");
    expect(screen.getByTestId("summary-booked-units")).toHaveTextContent("158");

    // Verify 4 projects rendered
    expect(screen.getByText("Skyfinia Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Skyfinia Phase 2")).toBeInTheDocument();
    expect(screen.getByText("Infinia Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Infinia Phase 2")).toBeInTheDocument();
  });

  it("filters projects by family", () => {
    const useProjectsSpy = vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    const familySelect = screen.getByTestId("projects-family-filter");
    fireEvent.change(familySelect, { target: { value: "Skyfinia" } });

    expect(useProjectsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ family: "Skyfinia" })
    );
  });

  it("filters projects by status", () => {
    const useProjectsSpy = vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    const statusSelect = screen.getByTestId("projects-status-filter");
    fireEvent.change(statusSelect, { target: { value: "Active" } });

    expect(useProjectsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Active" })
    );
  });

  it("filters projects by search term with debounce", async () => {
    const useProjectsSpy = vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    const searchInput = screen.getByTestId("projects-search-input");
    fireEvent.change(searchInput, { target: { value: "Skyfinia" } });

    await waitFor(
      () => {
        expect(useProjectsSpy).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Skyfinia" })
        );
      },
      { timeout: 500 }
    );
  });

  it("changes sorting criteria", () => {
    const useProjectsSpy = vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    const sortSelect = screen.getByTestId("projects-sort-by");
    fireEvent.change(sortSelect, { target: { value: "target_units" } });

    expect(useProjectsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "target_units" })
    );
  });

  it("navigates to project detail when View Project button is clicked", () => {
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(projectsHook, "useProjectDetail").mockReturnValue({
      data: {
        ...MOCK_LIST_DATA.items[0],
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
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);

    const viewProjectBtn = screen.getByTestId("view-project-prj-sky-p1-btn");
    fireEvent.click(viewProjectBtn);

    expect(screen.getByTestId("back-to-projects-btn")).toBeInTheDocument();
  });

  it("calls onSelectProject prop when provided", () => {
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: MOCK_LIST_DATA,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const onSelectProjectMock = vi.fn();
    render(<ProjectsDirectoryView onSelectProject={onSelectProjectMock} />);

    const viewProjectBtn = screen.getByTestId("view-project-prj-sky-p1-btn");
    fireEvent.click(viewProjectBtn);

    expect(onSelectProjectMock).toHaveBeenCalledWith("prj-sky-p1");
  });

  it("renders loading state", () => {
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry option", () => {
    const refetchMock = vi.fn();
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Network connection lost"),
      refetch: refetchMock,
    } as any);

    render(<ProjectsDirectoryView />);
    expect(screen.getByText("Unable to load project portfolio")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("renders empty state when no projects match filters", () => {
    vi.spyOn(projectsHook, "useProjects").mockReturnValue({
      data: {
        items: [],
        pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 },
        portfolio_summary: {
          total_projects: 0,
          total_families: 0,
          total_target_units: 0,
          total_available_units: 0,
          total_booked_units: 0,
          total_booking_value_inr: 0,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ProjectsDirectoryView />);
    expect(screen.getByText("No projects found")).toBeInTheDocument();
  });
});
