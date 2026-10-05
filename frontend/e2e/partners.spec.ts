import { test, expect } from "@playwright/test";

test.describe("Channel Partners API & Real Partners Directory (Phase 2C-2)", () => {
  test("navigates from Overview to Partners, filters, paginates, and inspects partner details", async ({
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

    // 3. Wait for real API data & verify directory header and total partners count
    await expect(page.getByRole("main").getByRole("heading", { name: "Channel Partners Directory" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Total Partners: 175")).toBeVisible();

    // 4. Verify search functionality with debouncing
    const searchInput = page.getByTestId("partners-search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("CP-1001");

    // Wait for search result to filter down
    await expect(page.getByTestId("partner-row-cp-1001")).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.clear();
    await expect(page.getByText("Total Partners: 175")).toBeVisible({ timeout: 5000 });

    // 5. Apply Tier 1 filter
    const tierFilter = page.getByTestId("partners-tier-filter");
    await tierFilter.selectOption("Tier 1");
    // Verify only Tier 1 badges are displayed
    await expect(page.getByText("Tier: Tier 1")).toBeVisible();

    // Reset tier filter
    await tierFilter.selectOption("");
    await expect(page.getByText("Total Partners: 175")).toBeVisible();

    // 6. Test Pagination navigation to Page 2
    const nextBtn = page.getByTestId("pagination-next-btn");
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.getByTestId("pagination-page-indicator")).toHaveText("Page 2 of 9");

    const prevBtn = page.getByTestId("pagination-prev-btn");
    await prevBtn.click();
    await expect(page.getByTestId("pagination-page-indicator")).toHaveText("Page 1 of 9");

    // 7. Open Partner Detail View (click first partner row or view profile button)
    const firstPartnerRow = page.locator("tbody tr").first();
    await expect(firstPartnerRow).toBeVisible();
    await firstPartnerRow.click();

    // 8. Verify Partner Detail View Header & KPIs
    await expect(page.getByTestId("back-to-directory-btn")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("detail-total-leads")).toBeVisible();
    await expect(page.getByTestId("detail-qualified-leads")).toBeVisible();
    await expect(page.getByTestId("detail-completed-visits")).toBeVisible();
    await expect(page.getByTestId("detail-confirmed-bookings")).toBeVisible();
    await expect(page.getByTestId("detail-visit-to-booking-rate")).toBeVisible();
    await expect(page.getByTestId("detail-overall-conversion-rate")).toBeVisible();

    // Verify recent leads & recent bookings sections
    await expect(page.getByText("Recent Inbound Leads")).toBeVisible();
    await expect(page.getByText("Recent Booking Closures")).toBeVisible();
    await expect(page.getByText("Conversion Funnel Velocity")).toBeVisible();

    // 9. Navigate back to Partners Directory
    const backBtn = page.getByTestId("back-to-directory-btn");
    await backBtn.click();

    // 10. Verify returned to Partners Directory
    await expect(page.getByTestId("partners-search-input")).toBeVisible();
    await expect(page.getByText("Total Partners: 175")).toBeVisible();
  });
});
