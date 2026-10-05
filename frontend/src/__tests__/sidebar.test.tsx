import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar, NAV_ITEMS } from "@/components/layout/sidebar";

describe("Sidebar Navigation Component", () => {
  it("renders all required navigation items and phase badges", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <Sidebar
        activeKey="overview"
        onSelect={handleSelect}
        isOpen={true}
        onClose={handleClose}
      />
    );

    expect(screen.getByText("Channel Partner")).toBeInTheDocument();
    expect(screen.getByText("Intelligence")).toBeInTheDocument();

    NAV_ITEMS.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });

    const partnersItem = screen.getByTestId("nav-item-partners");
    fireEvent.click(partnersItem);
    expect(handleSelect).toHaveBeenCalledWith("partners");
    expect(handleClose).toHaveBeenCalled();
  });

  it("handles close button click in mobile state", () => {
    const handleClose = vi.fn();
    render(
      <Sidebar
        activeKey="overview"
        onSelect={vi.fn()}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByLabelText("Close sidebar");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
