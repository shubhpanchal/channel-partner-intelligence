import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/app/providers";

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>);
}

describe("AppShell Component", () => {
  it("renders top level application shell with header and sidebar", () => {
    renderWithProviders(<AppShell />);

    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByTestId("overview-dashboard-container")).toBeInTheDocument();
  });

  it("navigates to placeholder section when navigation item is clicked", () => {
    renderWithProviders(<AppShell />);

    // Click on Partners navigation
    const partnersNav = screen.getByTestId("nav-item-partners");
    fireEvent.click(partnersNav);

    expect(screen.getAllByText("Channel Partners Directory").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Scheduled for Phase 2")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-view-container")).toBeInTheDocument();

    // Click back to overview
    const backBtn = screen.getByTestId("back-to-overview-button");
    fireEvent.click(backBtn);

    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByTestId("overview-dashboard-container")).toBeInTheDocument();
  });

  it("toggles mobile sidebar visibility", () => {
    renderWithProviders(<AppShell />);

    const toggleBtn = screen.getByTestId("sidebar-toggle-button");
    fireEvent.click(toggleBtn);

    const backdrop = screen.getByTestId("sidebar-backdrop");
    expect(backdrop).toBeInTheDocument();

    // Clicking backdrop closes sidebar
    fireEvent.click(backdrop);
    expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
  });
});
