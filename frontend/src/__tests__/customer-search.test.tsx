import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerSearch } from "@/components/layout/customer-search";
import * as customersApi from "@/lib/api/customers";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const MOCK_RESULTS: customersApi.CustomerSearchResponse = {
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

function renderCustomerSearch() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomerSearch />
    </QueryClientProvider>
  );
}

describe("CustomerSearch component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it("renders search input with placeholder", () => {
    renderCustomerSearch();
    const input = screen.getByTestId("global-customer-search-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search customer, lead, phone...");
  });

  it("shows search results dropdown and navigates on select", async () => {
    vi.spyOn(customersApi, "searchCustomers").mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup();

    renderCustomerSearch();
    const input = screen.getByTestId("global-customer-search-input");

    await user.type(input, "Aarav");

    await waitFor(() => {
      expect(screen.getByTestId("global-customer-search-dropdown")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Aarav Mehta")).toBeInTheDocument();
      expect(screen.getByText("LD-2026-000067")).toBeInTheDocument();
      expect(screen.getByText("Skyfinia Phase 1")).toBeInTheDocument();
      expect(screen.getByText("Elite Realty Partners")).toBeInTheDocument();
    });

    const resultItem = screen.getByTestId("search-result-item-ld-000067");
    await user.click(resultItem);

    expect(mockPush).toHaveBeenCalledWith("/customers/ld-000067");
  });

  it("displays empty state when no matching customers are found", async () => {
    vi.spyOn(customersApi, "searchCustomers").mockResolvedValue({ items: [], total: 0 });
    const user = userEvent.setup();

    renderCustomerSearch();
    const input = screen.getByTestId("global-customer-search-input");

    await user.type(input, "UnknownPerson");

    await waitFor(() => {
      expect(screen.getByTestId("search-empty-message")).toBeInTheDocument();
      expect(screen.getByText("No customers found")).toBeInTheDocument();
    });
  });

  it("displays error state when search fails", async () => {
    vi.spyOn(customersApi, "searchCustomers").mockRejectedValue(new Error("Network failure"));
    const user = userEvent.setup();

    renderCustomerSearch();
    const input = screen.getByTestId("global-customer-search-input");

    await user.type(input, "ErrorQuery");

    await waitFor(() => {
      expect(screen.getByTestId("search-error-message")).toBeInTheDocument();
      expect(screen.getByText(/Unable to search customers/)).toBeInTheDocument();
    });
  });

  it("clears search input and closes dropdown when clear button is clicked", async () => {
    vi.spyOn(customersApi, "searchCustomers").mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup();

    renderCustomerSearch();
    const input = screen.getByTestId("global-customer-search-input");

    await user.type(input, "Aarav");

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearBtn);

    expect(input).toHaveValue("");
    expect(screen.queryByTestId("global-customer-search-dropdown")).not.toBeInTheDocument();
  });
});
