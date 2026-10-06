import { test, expect } from "@playwright/test";

test.describe("Projects Portfolio & Project Detail (Phase 2E)", () => {
  test("navigates to Projects portfolio, filters families, opens Skyfinia Phase 1 detail, verifies metrics/funnel/trends/partners/recent bookings, navigates back, and tests mobile responsiveness", async ({
    page,
  }) => {
    // 1. Navigate to Executive Overview
    await page.goto("/");
    await expect(page).toHaveTitle(/Channel Partner Intelligence/);
    await expect(page.getByText("Executive Overview")).toBeVisible();

    // 2. Click on Projects in sidebar navigation
    const projectsNav = page.getByTestId("nav-item-projects");
    await expect(projectsNav).toBeVisible();
    await projectsNav.click();

    // 3. Verify Projects Portfolio container, title, synthetic indicator, and summary strip
    await expect(page.getByTestId("projects-portfolio-container")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("projects-heading")).toHaveText("Project Portfolio");
    await expect(page.getByTestId("demo-environment-badge")).toBeVisible();

    await expect(page.getByTestId("portfolio-summary-strip")).toBeVisible();
    await expect(page.getByTestId("summary-total-projects")).toHaveText("4");
    await expect(page.getByTestId("summary-total-families")).toHaveText("2");
    await expect(page.getByTestId("summary-target-units")).toHaveText("1,250");
    await expect(page.getByTestId("summary-available-units")).toHaveText("1,092");
    await expect(page.getByTestId("summary-booked-units")).toHaveText("158");

    // 4. Verify all 4 canonical projects are visible
    await expect(page.getByText("Skyfinia Phase 1")).toBeVisible();
    await expect(page.getByText("Skyfinia Phase 2")).toBeVisible();
    await expect(page.getByText("Infinia Phase 1")).toBeVisible();
    await expect(page.getByText("Infinia Phase 2")).toBeVisible();

    // 5. Test Family Filter: Skyfinia
    const familyFilter = page.getByTestId("projects-family-filter");
    await familyFilter.selectOption("Skyfinia");
    await page.waitForTimeout(400);
    await expect(page.getByText("Skyfinia Phase 1")).toBeVisible();
    await expect(page.getByText("Skyfinia Phase 2")).toBeVisible();
    await expect(page.getByText("Infinia Phase 1")).not.toBeVisible();
    await expect(page.getByText("Infinia Phase 2")).not.toBeVisible();

    // Test Family Filter: Infinia
    await familyFilter.selectOption("Infinia");
    await page.waitForTimeout(400);
    await expect(page.getByText("Infinia Phase 1")).toBeVisible();
    await expect(page.getByText("Infinia Phase 2")).toBeVisible();
    await expect(page.getByText("Skyfinia Phase 1")).not.toBeVisible();
    await expect(page.getByText("Skyfinia Phase 2")).not.toBeVisible();

    // Reset Family Filter
    await familyFilter.selectOption("all");
    await page.waitForTimeout(400);
    await expect(page.getByText("Skyfinia Phase 1")).toBeVisible();
    await expect(page.getByText("Infinia Phase 1")).toBeVisible();

    // 6. Test Search: "prj-sky-p1"
    const searchInput = page.getByTestId("projects-search-input");
    await searchInput.fill("prj-sky-p1");
    await page.waitForTimeout(500);
    await expect(page.getByText("Skyfinia Phase 1")).toBeVisible();
    await expect(page.getByText("Skyfinia Phase 2")).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // 7. Open Skyfinia Phase 1 Project Detail
    const viewProjectBtn = page.getByTestId("view-project-prj-sky-p1-btn");
    await expect(viewProjectBtn).toBeVisible();
    await viewProjectBtn.click();

    // 8. Verify Project Detail View Header & Identity
    await expect(page.getByTestId("back-to-projects-btn")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Skyfinia Phase 1" })).toBeVisible();
    await expect(page.getByText("Tathawade, Pune")).toBeVisible();
    await expect(page.getByText("Starting Price Floor:")).toBeVisible();
    await expect(page.getByText("Inventory Allocation")).toBeVisible();

    // 9. Verify 6 KPI Cards
    await expect(page.getByTestId("kpi-valid-leads")).toBeVisible();
    await expect(page.getByTestId("kpi-qualified-leads")).toBeVisible();
    await expect(page.getByTestId("kpi-completed-visits")).toBeVisible();
    await expect(page.getByTestId("kpi-confirmed-bookings")).toBeVisible();
    await expect(page.getByTestId("kpi-booking-value")).toBeVisible();
    await expect(page.getByTestId("kpi-overall-conversion")).toBeVisible();

    // 10. Verify 4-Stage Funnel Flow
    await expect(page.getByText("Project Funnel Velocity")).toBeVisible();
    await expect(page.getByText("1. Valid Leads")).toBeVisible();
    await expect(page.getByText("2. Qualified Leads")).toBeVisible();
    await expect(page.getByText("3. Visited Prospects")).toBeVisible();
    await expect(page.getByText("4. Confirmed Bookings")).toBeVisible();

    // 11. Verify Monthly Trend Velocity Chart
    await expect(page.getByTestId("chart-project-monthly-trend")).toBeVisible();
    await expect(page.getByText("Pipeline Velocity & Monthly Activity (2026)")).toBeVisible();

    // 12. Verify Top Contributing Channel Partners
    await expect(page.getByTestId("top-partners-card")).toBeVisible();
    await expect(page.getByText("Top Contributing Channel Partners")).toBeVisible();

    // 13. Verify Recent Project Bookings Viewport
    await expect(page.getByTestId("recent-project-bookings-card")).toBeVisible();
    await expect(page.getByText("Recent Project Booking Closures")).toBeVisible();

    // 14. Navigate back to Projects Portfolio
    const backBtn = page.getByTestId("back-to-projects-btn");
    await backBtn.click();
    await expect(page.getByTestId("projects-portfolio-container")).toBeVisible();
    await expect(page.getByTestId("portfolio-summary-strip")).toBeVisible();

    // 15. Responsive Viewport Verification (Mobile 375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Verify no horizontal document scroll/overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin tolerance

    // Verify key mobile elements remain interactive
    await expect(page.getByTestId("projects-heading")).toBeVisible();
    await expect(page.getByTestId("projects-search-input")).toBeVisible();
  });
});
