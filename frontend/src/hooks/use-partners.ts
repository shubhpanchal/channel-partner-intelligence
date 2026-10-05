"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPartnerById,
  fetchPartners,
  PartnerDetailResponse,
  PartnerFilters,
  PartnerListResponse,
} from "@/lib/api/partners";

export const PARTNERS_DIRECTORY_QUERY_KEY = "partners-directory";
export const PARTNER_DETAIL_QUERY_KEY = "partner-detail";

/**
 * Custom hook to fetch paginated Partners Directory data with filters using TanStack Query
 */
export function usePartners(filters?: PartnerFilters) {
  return useQuery<PartnerListResponse, Error>({
    queryKey: [PARTNERS_DIRECTORY_QUERY_KEY, filters],
    queryFn: () => fetchPartners(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Custom hook to fetch detailed individual partner information using TanStack Query
 */
export function usePartnerDetail(partnerId: string | null) {
  return useQuery<PartnerDetailResponse, Error>({
    queryKey: [PARTNER_DETAIL_QUERY_KEY, partnerId],
    queryFn: () => {
      if (!partnerId) {
        throw new Error("Partner ID is required.");
      }
      return fetchPartnerById(partnerId);
    },
    enabled: !!partnerId,
    staleTime: 60 * 1000,
  });
}
