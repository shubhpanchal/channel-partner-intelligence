/**
 * Overview Summary API Client and Type Definitions
 */

export interface ActivePartnersBreakdown {
  tier_1: number;
  tier_2: number;
  tier_3: number;
}

export interface ActivePartnersKpi {
  value: number;
  growth_pct: number | null;
  breakdown: ActivePartnersBreakdown;
}

export interface ChannelLeadFlowKpi {
  value: number;
  total_leads: number;
  valid_leads: number;
  qualified_leads: number;
  qualification_rate_pct: number;
  growth_pct: number | null;
}

export interface SiteVisitsKpi {
  total_scheduled: number;
  total_completed: number;
  visit_completion_rate_pct: number;
  unique_visited_leads: number;
  qualified_lead_to_visit_rate_pct: number;
  growth_pct: number | null;
}

export interface BookingsVelocityKpi {
  units_count: number;
  confirmed_bookings: number;
  confirmed_from_visited_leads: number;
  direct_confirmed_bookings: number;
  total_value_inr: number;
  visit_to_booking_rate_pct: number;
  overall_conversion_rate_pct: number;
  growth_pct: number | null;
}

export interface OverviewKpis {
  active_partners: ActivePartnersKpi;
  channel_lead_flow: ChannelLeadFlowKpi;
  site_visits: SiteVisitsKpi;
  bookings_velocity: BookingsVelocityKpi;
}

export interface PartnerTierDistributionItem {
  tier: string;
  partners_count: number;
  percentage: number;
  contribution: string;
}

export interface MonthlyTrendItem {
  month: string;
  leads: number;
  site_visits: number;
  bookings: number;
}

export interface RecentActivityItem {
  id: string;
  partner_name: string;
  action: string;
  logged_at: string;
  time_ago: string;
  status: "success" | "info" | "neutral" | "warning" | string;
  tag: string;
}

export interface AttentionAlertItem {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | string;
}

export interface OverviewSummaryResponse {
  kpis: OverviewKpis;
  tier_breakdown: PartnerTierDistributionItem[];
  monthly_trends: MonthlyTrendItem[];
  recent_activities: RecentActivityItem[];
  attention_alerts: AttentionAlertItem[];
}

export interface OverviewSummaryFilters {
  start_date?: string;
  end_date?: string;
  project_id?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

/**
 * Fetch consolidated Overview Summary from GET /api/v1/overview/summary
 */
export async function fetchOverviewSummary(
  filters?: OverviewSummaryFilters
): Promise<OverviewSummaryResponse> {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  if (filters?.project_id) params.append("project_id", filters.project_id);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/overview/summary${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch overview summary (${response.status} ${response.statusText})`;
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
