import { test, expect } from "@playwright/test";

test.describe("Global Customer Search & Deterministic Booking Scenario (Issue #11)", () => {
  test("searches deterministic customer Aarav Mehta, navigates to detail, and verifies replacement booking history", async ({
    page,
  }) => {
    // 1. Open application
    await page.goto("/");
    await expect(page).toHaveTitle(/Channel Partner Intelligence/);
    await expect(page.getByText("Executive Overview")).toBeVisible();

    // 2. Locate global customer search input in header
    const searchInput = page.getByTestId("global-customer-search-input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", "Search customer, lead, phone...");

    // 3. Search for the deterministic demo customer
    await searchInput.fill("Aarav Mehta");

    // Wait for dropdown popover to appear
    const searchDropdown = page.getByTestId("global-customer-search-dropdown");
    await expect(searchDropdown).toBeVisible({ timeout: 10000 });

    // Verify search result contents
    const resultItem = page.getByTestId("search-result-item-ld-000067");
    await expect(resultItem).toBeVisible();
    await expect(resultItem.getByText("Aarav Mehta")).toBeVisible();
    await expect(resultItem.getByText("LD-2026-000067")).toBeVisible();
    await expect(resultItem.getByText("Skyfinia Phase 1")).toBeVisible();
    await expect(resultItem.getByText("Elite Realty Partners")).toBeVisible();

    // 4. Select result
    await resultItem.click();

    // 5. Verify customer detail opens at /customers/ld-000067
    await page.waitForURL("**/customers/ld-000067", { timeout: 10000 });
    await expect(page.getByTestId("customer-detail-view")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("customer-name-heading")).toHaveText("Aarav Mehta");
    await expect(page.getByText("LD-2026-000067")).toBeVisible();

    // Verify Attribution
    await expect(page.getByTestId("view-partner-profile-btn")).toBeVisible();
    await expect(page.getByText("Elite Realty Partners", { exact: true })).toBeVisible();
    await expect(page.getByText("Rohit Deshmukh")).toBeVisible();

    // 6. Verify Cancelled Booking Attempt A appears
    const cancelledBookingRow = page.getByTestId("customer-booking-row-bk-000014");
    await expect(cancelledBookingRow).toBeVisible();
    await expect(cancelledBookingRow.getByText("BK-2026-000014")).toBeVisible();
    await expect(cancelledBookingRow.getByText("Unit 773")).toBeVisible();
    await expect(cancelledBookingRow.getByText("Cancelled", { exact: true })).toBeVisible();

    // 7. Verify Replacement Booking Attempt B appears
    const replacementBookingRow = page.getByTestId("customer-booking-row-bk-000015");
    await expect(replacementBookingRow).toBeVisible();
    await expect(replacementBookingRow.getByText("BK-2026-000015")).toBeVisible();
    await expect(replacementBookingRow.getByText("Unit 1706")).toBeVisible();
    await expect(replacementBookingRow.getByText("Confirmed", { exact: true })).toBeVisible();

    // 8. Verify replacement lifecycle banner and chronology
    await expect(page.getByTestId("replacement-lifecycle-banner")).toBeVisible();
    await expect(page.getByText("Unit Replacement Lifecycle Detected")).toBeVisible();

    // 9. Verify different units are displayed
    await expect(cancelledBookingRow.getByText("Unit 773")).toBeVisible();
    await expect(replacementBookingRow.getByText("Unit 1706")).toBeVisible();

    // 10. Verify cancellation timestamp is visible
    await expect(cancelledBookingRow.getByText(/Cancellation:/)).toBeVisible();

    // 11. Verify back navigation
    const backBtn = page.getByTestId("back-to-dashboard-btn");
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.getByText("Executive Overview")).toBeVisible();
  });

  test("supports phone and lead code queries and handles empty results", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByTestId("global-customer-search-input");
    await expect(searchInput).toBeVisible();

    // Search by phone
    await searchInput.fill("9822099901");
    const searchDropdown = page.getByTestId("global-customer-search-dropdown");
    await expect(searchDropdown).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("search-result-item-ld-000067")).toBeVisible();

    // Clear and search by lead code
    await searchInput.clear();
    await searchInput.fill("LD-2026-000067");
    await expect(page.getByTestId("search-result-item-ld-000067")).toBeVisible();

    // Search non-existent query
    await searchInput.clear();
    await searchInput.fill("ZZZZ9999NONEXISTENT");
    await expect(page.getByTestId("search-empty-message")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("No customers found")).toBeVisible();
  });
});
