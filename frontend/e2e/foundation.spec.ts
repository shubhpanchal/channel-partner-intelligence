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
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByText("Channel Partner")).toBeVisible();
    await expect(page.getByText("Intelligence")).toBeVisible();

    // Verify Overview KPI Cards
    await expect(page.getByText("Active Partners")).toBeVisible();
    await expect(page.getByText("Channel Lead Flow")).toBeVisible();
    await expect(page.getByText("Visit Conversion")).toBeVisible();
    await expect(page.getByText("Bookings Velocity")).toBeVisible();

    // Verify Navigation switching
    await page.getByTestId("nav-item-partners").click();
    await expect(page.getByText("Channel Partners Directory")).toBeVisible();
    await expect(page.getByText("Scheduled for Phase 2")).toBeVisible();

    // Back to overview
    await page.getByTestId("back-to-overview-button").click();
    await expect(page.getByText("Executive Overview")).toBeVisible();
  });
});
