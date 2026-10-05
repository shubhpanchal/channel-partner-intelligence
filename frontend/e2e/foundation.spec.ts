import { test, expect } from "@playwright/test";

test.describe("Channel Partner Intelligence - Phase 1 Foundation E2E", () => {
  test("loads application shell and default overview dashboard", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify Title & Header
    await expect(page).toHaveTitle(/Channel Partner Intelligence/);
    await expect(page.getByTestId("app-header")).toBeVisible();
    await expect(page.getByText("Executive Overview")).toBeVisible();

    // Verify Sidebar & Brand
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("heading", { name: "Channel Partner" })).toBeVisible();
    await expect(sidebar.getByText("Intelligence")).toBeVisible();

    // Verify Overview KPI Cards (allowing time for API response)
    await expect(page.getByText("Active Partners")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Channel Lead Flow")).toBeVisible();
    await expect(page.getByText("Visit Conversion")).toBeVisible();
    await expect(page.getByText("Bookings Velocity")).toBeVisible();

    // Verify Navigation switching
    await page.getByTestId("nav-item-partners").click();
    await expect(page.getByTestId("app-header").getByRole("heading", { name: "Channel Partners Directory" })).toBeVisible();
    await expect(page.getByText("Scheduled for Phase 2")).toBeVisible();

    // Back to overview
    await page.getByTestId("back-to-overview-button").click();
    await expect(page.getByText("Executive Overview")).toBeVisible();
  });
});
