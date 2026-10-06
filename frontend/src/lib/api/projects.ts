/**
 * Projects API Client and Type Definitions
 */

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProjectSummaryMetrics {
  target_units: number;
  available_units: number;
  booked_units: number;
  inventory_utilization_pct: number;
  total_leads: number;
  valid_leads: number;
  qualified_leads: number;
  qualification_rate_pct: number;
  completed_visits: number;
  confirmed_bookings: number;
  gross_booking_value_inr: number;
  overall_conversion_rate_pct: number;
}

export interface ProjectPortfolioSummary {
  total_projects: number;
  total_families: number;
  total_target_units: number;
  total_available_units: number;
  total_booked_units: number;
  total_booking_value_inr: number;
}

export interface ProjectListItem {
  id: string;
  project_code: string;
  name: string;
  project_family: string;
  project_type: string;
  location: string;
  city: string;
  status: string;
  launch_date: string;
  target_units: number;
  available_units: number;
  starting_price: number;
  metrics: ProjectSummaryMetrics;
}

export interface ProjectListResponse {
  items: ProjectListItem[];
  pagination: PaginationMetadata;
  portfolio_summary: ProjectPortfolioSummary;
}

export interface ProjectInventoryMetrics {
  target_units: number;
  available_units: number;
  booked_units: number;
  inventory_utilization_pct: number;
}

export interface ProjectLeadMetrics {
  total_leads: number;
  valid_leads: number;
  qualified_leads: number;
  qualification_rate_pct: number;
}

export interface ProjectSiteVisitMetrics {
  scheduled_visits: number;
  completed_visits: number;
  visit_completion_rate_pct: number;
  unique_visited_leads: number;
  qualified_lead_to_visit_rate_pct: number;
}

export interface ProjectBookingMetrics {
  confirmed_bookings: number;
  confirmed_from_visited_leads: number;
  direct_confirmed_bookings: number;
  visit_to_booking_rate_pct: number;
  overall_lead_to_booking_rate_pct: number;
  gross_booking_value_inr: number;
}

export interface ProjectPartnerMetrics {
  contributing_lead_partners: number;
  contributing_booking_partners: number;
}

export interface ProjectMonthlyTrendItem {
  month: string;
  leads: number;
  completed_visits: number;
  bookings: number;
}

export interface ProjectTopPartnerItem {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  tier: string;
  assigned_salesperson_name?: string | null;
  valid_leads: number;
  completed_visits: number;
  confirmed_bookings: number;
  booking_value_inr: number;
  overall_conversion_rate_pct: number;
}

export interface ProjectRecentBookingItem {
  id: string;
  booking_reference: string;
  lead_id: string;
  customer_name: string;
  channel_partner_id: string;
  channel_partner_name: string;
  unit_number: string;
  unit_type: string;
  booking_date: string;
  booking_status: string;
  booking_value: number;
}

export interface ProjectDetailResponse {
  id: string;
  project_code: string;
  name: string;
  project_family: string;
  project_type: string;
  location: string;
  city: string;
  status: string;
  launch_date: string;
  target_units: number;
  available_units: number;
  starting_price: number;
  inventory: ProjectInventoryMetrics;
  lead_metrics: ProjectLeadMetrics;
  site_visit_metrics: ProjectSiteVisitMetrics;
  booking_metrics: ProjectBookingMetrics;
  partner_metrics: ProjectPartnerMetrics;
  monthly_trends: ProjectMonthlyTrendItem[];
  top_partners: ProjectTopPartnerItem[];
  recent_bookings: ProjectRecentBookingItem[];
}

export interface ProjectFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  family?: string;
  status?: string;
  sortBy?: string;
}

const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Fetch paginated project portfolio directory with summary KPIs and filters.
 */
export async function fetchProjects(
  filters: ProjectFilters = {}
): Promise<ProjectListResponse> {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set("page", filters.page.toString());
  }
  if (filters.pageSize && filters.pageSize !== 20) {
    params.set("page_size", filters.pageSize.toString());
  }
  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.family && filters.family !== "all") {
    params.set("family", filters.family.trim());
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status.trim());
  }
  if (filters.sortBy && filters.sortBy !== "name") {
    params.set("sort_by", filters.sortBy.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/projects${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch projects (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch detailed metrics, inventory, funnels, top partners, and recent closures for a project.
 */
export async function fetchProjectById(
  projectId: string
): Promise<ProjectDetailResponse> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const url = `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch project details (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
