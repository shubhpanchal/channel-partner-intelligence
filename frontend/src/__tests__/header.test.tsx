import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("Header Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page title, subtitle, search input, and health indicator", () => {
    const handleOpenSidebar = vi.fn();

    renderWithProviders(
      <Header
        title="Executive Overview"
        subtitle="Real-time channel metrics"
        onOpenSidebar={handleOpenSidebar}
      />
    );

    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByText("Real-time channel metrics")).toBeInTheDocument();
    expect(screen.getByTestId("global-customer-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("backend-status-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("demo-environment-indicator")).toBeInTheDocument();

    const toggleBtn = screen.getByTestId("sidebar-toggle-button");
    fireEvent.click(toggleBtn);
    expect(handleOpenSidebar).toHaveBeenCalled();
  });

  it("renders profile menu trigger and notification placeholder", () => {
    renderWithProviders(
      <Header
        title="Overview"
        onOpenSidebar={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-button")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-trigger")).toBeInTheDocument();
  });
});

