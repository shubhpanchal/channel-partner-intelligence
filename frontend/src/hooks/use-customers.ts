"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchCustomers,
  fetchCustomerById,
  CustomerSearchResponse,
  CustomerDetailResponse,
} from "@/lib/api/customers";

export const CUSTOMER_SEARCH_QUERY_KEY = "customer-search";
export const CUSTOMER_DETAIL_QUERY_KEY = "customer-detail";

/**
 * Hook for global customer search with debouncing.
 */
export function useCustomerSearch(
  query: string,
  pageSize: number = 10,
  options?: { enabled?: boolean }
) {
  const trimmed = query.trim();
  const isQueryValid = trimmed.length >= 2;
  const isEnabled = options?.enabled !== undefined ? options.enabled && isQueryValid : isQueryValid;

  return useQuery<CustomerSearchResponse, Error>({
    queryKey: [CUSTOMER_SEARCH_QUERY_KEY, trimmed, pageSize],
    queryFn: () => searchCustomers(trimmed, pageSize),
    enabled: isEnabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for fetching single customer detail and booking lifecycle history.
 */
export function useCustomerDetail(leadId: string) {
  return useQuery<CustomerDetailResponse, Error>({
    queryKey: [CUSTOMER_DETAIL_QUERY_KEY, leadId],
    queryFn: () => fetchCustomerById(leadId),
    enabled: !!leadId,
    staleTime: 60 * 1000, // 60 seconds
  });
}
