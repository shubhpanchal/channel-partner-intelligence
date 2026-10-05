import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/layout/header";

describe("Header Component", () => {
  it("renders page title, subtitle, and health indicator", () => {
    const handleOpenSidebar = vi.fn();

    render(
      <Header
        title="Executive Overview"
        subtitle="Real-time channel metrics"
        onOpenSidebar={handleOpenSidebar}
      />
    );

    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByText("Real-time channel metrics")).toBeInTheDocument();
    expect(screen.getByTestId("backend-status-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("demo-environment-indicator")).toBeInTheDocument();

    const toggleBtn = screen.getByTestId("sidebar-toggle-button");
    fireEvent.click(toggleBtn);
    expect(handleOpenSidebar).toHaveBeenCalled();
  });

  it("renders profile menu trigger and notification placeholder", () => {
    render(
      <Header
        title="Overview"
        onOpenSidebar={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-button")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-trigger")).toBeInTheDocument();
  });
});
