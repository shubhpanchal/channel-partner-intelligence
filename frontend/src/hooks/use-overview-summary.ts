"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchOverviewSummary,
  OverviewSummaryFilters,
  OverviewSummaryResponse,
} from "@/lib/api/overview";

export const OVERVIEW_SUMMARY_QUERY_KEY = "overview-summary";

/**
 * Custom hook to fetch Overview Summary data using TanStack Query
 */
export function useOverviewSummary(filters?: OverviewSummaryFilters) {
  return useQuery<OverviewSummaryResponse, Error>({
    queryKey: [OVERVIEW_SUMMARY_QUERY_KEY, filters],
    queryFn: () => fetchOverviewSummary(filters),
    staleTime: 60 * 1000,
  });
}
