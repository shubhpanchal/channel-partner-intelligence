import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  OverviewView,
  SAMPLE_PARTNER_TIERS_RAW,
  TOTAL_SAMPLE_PARTNERS,
  SAMPLE_PARTNER_TIERS,
} from "@/components/dashboard/overview-view";

describe("OverviewView Component", () => {
  describe("Partner Tier Breakdown Mathematical Consistency", () => {
    it("verifies that tier counts sum exactly to total active partners (18 + 45 + 112 = 175)", () => {
      const sumCounts = SAMPLE_PARTNER_TIERS_RAW.reduce(
        (sum, item) => sum + item.partners,
        0
      );
      expect(sumCounts).toBe(175);
      expect(TOTAL_SAMPLE_PARTNERS).toBe(175);

      // Verify individual tier counts
      expect(SAMPLE_PARTNER_TIERS_RAW[0].partners).toBe(18);
      expect(SAMPLE_PARTNER_TIERS_RAW[1].partners).toBe(45);
      expect(SAMPLE_PARTNER_TIERS_RAW[2].partners).toBe(112);
    });

    it("verifies that derived percentages mathematically correspond to partner counts", () => {
      const tolerance = 0.01;

      // Tier 1 (Elite): 18 / 175 = ~10.2857% -> 10.3%
      const tier1 = SAMPLE_PARTNER_TIERS.find((t) => t.tier === "Tier 1 (Elite)");
      expect(tier1).toBeDefined();
      expect(Math.abs(tier1!.percentage - (18 / 175) * 100)).toBeLessThan(tolerance);
      expect(tier1!.contribution).toBe("10.3%");

      // Tier 2 (Growth): 45 / 175 = ~25.7142% -> 25.7%
      const tier2 = SAMPLE_PARTNER_TIERS.find((t) => t.tier === "Tier 2 (Growth)");
      expect(tier2).toBeDefined();
      expect(Math.abs(tier2!.percentage - (45 / 175) * 100)).toBeLessThan(tolerance);
      expect(tier2!.contribution).toBe("25.7%");

      // Tier 3 (Active): 112 / 175 = ~64.0000% -> 64.0%
      const tier3 = SAMPLE_PARTNER_TIERS.find((t) => t.tier === "Tier 3 (Active)");
      expect(tier3).toBeDefined();
      expect(Math.abs(tier3!.percentage - (112 / 175) * 100)).toBeLessThan(tolerance);
      expect(tier3!.contribution).toBe("64.0%");
    });
  });

  describe("UI Rendering", () => {
    it("renders Phase 1 Foundation Checkpoint banner and KPI placeholders", () => {
      render(<OverviewView />);

      expect(screen.getByText("Phase 1 Foundation Checkpoint")).toBeInTheDocument();
      expect(screen.getByText("Active Partners")).toBeInTheDocument();
      expect(screen.getByText("Channel Lead Flow")).toBeInTheDocument();
      expect(screen.getByText("Visit Conversion")).toBeInTheDocument();
      expect(screen.getByText("Bookings Velocity")).toBeInTheDocument();

      expect(screen.getByText("Pipeline Velocity & Volume Trends")).toBeInTheDocument();
      expect(screen.getByText("Partner Tier Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Recent Channel Activity")).toBeInTheDocument();
      expect(screen.getByText("Attention Center")).toBeInTheDocument();
    });

    it("renders partner tier counts and mathematically consistent percentage badges in the UI", () => {
      render(<OverviewView />);

      // Verify tier labels and counts
      expect(screen.getByText("Tier 1 (Elite)")).toBeInTheDocument();
      expect(screen.getByText("18 partners")).toBeInTheDocument();
      expect(screen.getByText("10.3%")).toBeInTheDocument();

      expect(screen.getByText("Tier 2 (Growth)")).toBeInTheDocument();
      expect(screen.getByText("45 partners")).toBeInTheDocument();
      expect(screen.getByText("25.7%")).toBeInTheDocument();

      expect(screen.getByText("Tier 3 (Active)")).toBeInTheDocument();
      expect(screen.getByText("112 partners")).toBeInTheDocument();
      expect(screen.getByText("64.0%")).toBeInTheDocument();
    });
  });
});
