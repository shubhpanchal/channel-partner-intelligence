import { test, expect } from "@playwright/test";

test.describe("Channel Partners Portfolio & Analytics (Phase 2C-2)", () => {
  test("navigates to Partners portfolio, switches views, inspects analytics, and verifies responsive layout", async ({
    page,
  }) => {
    // 1. Navigate to Overview Dashboard
    await page.goto("/");
    await expect(page).toHaveTitle(/Channel Partner Intelligence/);
    await expect(page.getByText("Executive Overview")).toBeVisible();

    // 2. Click on Channel Partners in sidebar navigation
    const partnersNav = page.getByTestId("nav-item-partners");
    await expect(partnersNav).toBeVisible();
    await partnersNav.click();

    // 3. Wait for real API data & verify portfolio header and summary context strip
    await expect(
      page.getByRole("main").getByRole("heading", { name: "Channel Partners Portfolio" })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId("portfolio-summary-bar")).toBeVisible();
    await expect(page.getByTestId("summary-total-partners")).toBeVisible();
    await expect(page.getByTestId("summary-active-partners")).toBeVisible();
    await expect(page.getByTestId("summary-tier-1")).toBeVisible();

    // 4. Verify default Cards View is active
    await expect(page.getByTestId("partners-cards-grid")).toBeVisible();
    const firstPartnerCard = page.locator("[data-testid^='partner-card-']").first();
    await expect(firstPartnerCard).toBeVisible();

    // 5. Verify search functionality with debouncing
    const searchInput = page.getByTestId("partners-search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("CP-1001");

    // Wait for search result card to filter down
    await expect(page.getByTestId("partner-card-cp-1001")).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.clear();

    // 6. Apply Tier 1 filter
    const tierFilter = page.getByTestId("partners-tier-filter");
    await tierFilter.selectOption("Tier 1");
    await expect(page.getByText("Tier: Tier 1")).toBeVisible();

    // Reset tier filter
    await tierFilter.selectOption("");

    // 7. Test Pagination navigation to Page 2
    const nextBtn = page.getByTestId("pagination-next-btn");
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.getByTestId("pagination-page-indicator")).toHaveText("Page 2 of 9");

    const prevBtn = page.getByTestId("pagination-prev-btn");
    await prevBtn.click();
    await expect(page.getByTestId("pagination-page-indicator")).toHaveText("Page 1 of 9");

    // 8. Test View Switcher: Toggle to List Mode
    const listModeBtn = page.getByTestId("view-mode-list-btn");
    await expect(listModeBtn).toBeVisible();
    await listModeBtn.click();

    await expect(page.getByTestId("partners-table-card")).toBeVisible();
    const firstPartnerRow = page.locator("[data-testid^='partner-row-']").first();
    await expect(firstPartnerRow).toBeVisible();

    // 9. Open Partner Detail View (click first partner row)
    await firstPartnerRow.click();

    // 10. Verify Partner Detail View Header, Profile, and Manager Assignment
    await expect(page.getByTestId("back-to-directory-btn")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Assigned Relationship Manager")).toBeVisible();

    // 11. Verify 4 Summary Performance Cards
    await expect(page.getByTestId("detail-total-leads")).toBeVisible();
    await expect(page.getByTestId("detail-qualified-leads")).toBeVisible();
    await expect(page.getByTestId("detail-completed-visits")).toBeVisible();
    await expect(page.getByTestId("detail-confirmed-bookings")).toBeVisible();

    // 12. Verify Funnel Velocity Flow
    await expect(page.getByText("Conversion Funnel Velocity")).toBeVisible();

    // 13. Verify Real Analytics Charts (Funnel Trend & Project Contribution)
    await expect(page.getByTestId("partner-analytics-section")).toBeVisible();
    await expect(page.getByTestId("chart-partner-funnel-trend")).toBeVisible();
    await expect(page.getByTestId("chart-project-contribution")).toBeVisible();
    await expect(page.getByText("Partner Funnel Trend")).toBeVisible();
    await expect(page.getByText("Project Booking Contribution")).toBeVisible();

    // 14. Verify Conversion Rates Matrix
    await expect(page.getByTestId("detail-visit-to-booking-rate")).toBeVisible();
    await expect(page.getByTestId("detail-overall-conversion-rate")).toBeVisible();

    // 15. Verify Bounded Internal Viewports for Recent Leads & Recent Bookings
    await expect(page.getByTestId("recent-leads-card")).toBeVisible();
    await expect(page.getByTestId("recent-bookings-card")).toBeVisible();
    await expect(page.getByText("Recent Inbound Leads")).toBeVisible();
    await expect(page.getByText("Recent Booking Closures")).toBeVisible();

    // 16. Verify Sticky Sidebar persists while scrolling main content
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();

    // Scroll main viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(sidebar).toBeVisible();

    // 17. Navigate back to Partners Directory
    const backBtn = page.getByTestId("back-to-directory-btn");
    await backBtn.click();

    // 18. Verify returned to Partners Directory
    await expect(page.getByTestId("partners-search-input")).toBeVisible();
  });

  test("renders responsive cards view correctly on mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile sidebar drawer
    const openMenuBtn = page.getByTestId("sidebar-toggle-button");
    await openMenuBtn.click();

    const partnersNav = page.getByTestId("nav-item-partners");
    await partnersNav.click();

    // Wait for partners list
    await expect(page.getByTestId("partners-cards-grid")).toBeVisible({ timeout: 15000 });
    const firstPartnerCard = page.locator("[data-testid^='partner-card-']").first();
    await expect(firstPartnerCard).toBeVisible();

    // Verify no horizontal overflow at document body level
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 1-2px tolerance
  });
});
