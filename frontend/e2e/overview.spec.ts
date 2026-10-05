import { test, expect } from "@playwright/test";

test.describe("Overview Summary API & Real Dashboard Integration (Phase 2C-1)", () => {
  test("loads real API-backed overview summary data and renders KPI cards, charts, and activity log", async ({
    page,
  }) => {
    // Navigate to Overview Dashboard
    await page.goto("/");

    // Verify Title & Header
    await expect(page).toHaveTitle(/Channel Partner Intelligence/);
    await expect(page.getByText("Executive Overview")).toBeVisible();

    // Verify Live Stream Banner
    await expect(
      page.getByText("Live Executive Intelligence Stream")
    ).toBeVisible({ timeout: 15000 });

    // Verify 4 Real KPI Cards rendered with database-backed values
    const activePartnersCard = page.getByTestId("kpi-card-active-partners");
    await expect(activePartnersCard).toBeVisible();
    await expect(page.getByTestId("kpi-value-active-partners")).toHaveText("152");

    const leadFlowCard = page.getByTestId("kpi-card-lead-flow");
    await expect(leadFlowCard).toBeVisible();
    await expect(page.getByTestId("kpi-value-lead-flow")).toHaveText("3,906");

    const visitConversionCard = page.getByTestId("kpi-card-visit-conversion");
    await expect(visitConversionCard).toBeVisible();
    await expect(page.getByTestId("kpi-value-visit-conversion")).toHaveText("50.9%");

    const bookingsVelocityCard = page.getByTestId("kpi-card-bookings-velocity");
    await expect(bookingsVelocityCard).toBeVisible();
    await expect(page.getByTestId("kpi-value-bookings-velocity")).toHaveText("454 Units");

    // Verify Partner Tier Breakdown
    const tierCard = page.getByTestId("card-partner-tier-breakdown");
    await expect(tierCard).toBeVisible();
    await expect(page.getByTestId("tier-row-0")).toContainText("Tier 1 (Elite)");
    await expect(page.getByTestId("tier-count-0")).toHaveText("18 partners");
    await expect(page.getByTestId("tier-pct-0")).toHaveText("10.3%");

    await expect(page.getByTestId("tier-row-1")).toContainText("Tier 2 (Growth)");
    await expect(page.getByTestId("tier-count-1")).toHaveText("45 partners");
    await expect(page.getByTestId("tier-pct-1")).toHaveText("25.7%");

    await expect(page.getByTestId("tier-row-2")).toContainText("Tier 3 (Active)");
    await expect(page.getByTestId("tier-count-2")).toHaveText("112 partners");
    await expect(page.getByTestId("tier-pct-2")).toHaveText("64.0%");

    // Verify Pipeline Velocity & Volume Trends Chart
    await expect(page.getByTestId("chart-pipeline-velocity")).toBeVisible();

    // Verify Recent Channel Activity Table
    const activityCard = page.getByTestId("card-recent-activity");
    await expect(activityCard).toBeVisible();
    await expect(page.getByText("Recent Channel Activity")).toBeVisible();

    // Verify Attention Center
    await expect(page.getByTestId("card-attention-center")).toBeVisible();
  });
});
