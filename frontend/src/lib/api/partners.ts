/**
 * Channel Partners API Client and Type Definitions
 */

export interface SalespersonBasic {
  id: string;
  name: string;
}

export interface SalespersonDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PartnerSummaryStats {
  total_leads: number;
  qualified_leads: number;
  completed_visits: number;
  confirmed_bookings: number;
  visit_to_booking_rate_pct: number;
  overall_conversion_rate_pct: number;
}

export interface PartnerListItem {
  id: string;
  partner_code: string;
  name: string;
  legal_name?: string | null;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  location: string;
  onboarding_date: string;
  active: boolean;
  tier: string;
  channel_type: string;
  assigned_salesperson?: SalespersonBasic | null;
  summary_stats: PartnerSummaryStats;
}

export interface PartnerListResponse {
  items: PartnerListItem[];
  pagination: PaginationMetadata;
}

export interface PartnerDetailedMetrics {
  total_leads: number;
  qualified_leads: number;
  qualification_rate_pct: number;
  scheduled_site_visits: number;
  completed_site_visits: number;
  visit_completion_rate_pct: number;
  unique_visited_leads: number;
  qualified_lead_to_visit_rate_pct: number;
  confirmed_bookings: number;
  visit_to_booking_rate_pct: number;
  overall_conversion_rate_pct: number;
  gross_booking_value_inr: number;
}

export interface PartnerRecentLeadItem {
  id: string;
  lead_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  project_id: string;
  project_name: string;
  status: string;
  budget_range?: string | null;
  requirement_type?: string | null;
  created_at: string;
  qualified_at?: string | null;
}

export interface PartnerRecentBookingItem {
  id: string;
  booking_reference: string;
  lead_id: string;
  customer_name: string;
  project_id: string;
  project_name: string;
  unit_number: string;
  unit_type: string;
  booking_date: string;
  booking_status: string;
  booking_value: number;
  token_amount: number;
  commission_rate_pct: number;
  commission_amount: number;
  salesperson_name: string;
  created_at: string;
}

export interface PartnerDetailResponse {
  id: string;
  partner_code: string;
  name: string;
  legal_name?: string | null;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  location: string;
  onboarding_date: string;
  active: boolean;
  tier: string;
  channel_type: string;
  notes?: string | null;
  assigned_salesperson?: SalespersonDetail | null;
  metrics: PartnerDetailedMetrics;
  recent_leads: PartnerRecentLeadItem[];
  recent_bookings: PartnerRecentBookingItem[];
}

export interface PartnerFilters {
  page?: number;
  page_size?: number;
  tier?: string;
  active?: boolean;
  city?: string;
  search?: string;
  sort_by?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

/**
 * Fetch paginated partners directory list from GET /api/v1/partners
 */
export async function fetchPartners(
  filters?: PartnerFilters
): Promise<PartnerListResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.page_size) params.append("page_size", filters.page_size.toString());
  if (filters?.tier) params.append("tier", filters.tier);
  if (filters?.active !== undefined) params.append("active", String(filters.active));
  if (filters?.city) params.append("city", filters.city);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sort_by) params.append("sort_by", filters.sort_by);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/partners${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch partners directory (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse errors on non-200 responses
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch individual channel partner detail by ID from GET /api/v1/partners/{id}
 */
export async function fetchPartnerById(
  id: string
): Promise<PartnerDetailResponse> {
  const url = `${API_BASE_URL}/api/v1/partners/${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch partner details (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse errors on non-200 responses
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
