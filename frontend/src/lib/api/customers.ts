/**
 * Customer Search & Lifecycle API Client and Type Definitions
 */

export interface CustomerSearchItem {
  lead_id: string;
  lead_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  project_id: string;
  project_name: string;
  lead_status: string;
  channel_partner_id: string;
  channel_partner_name: string;
  salesperson_id?: string | null;
  salesperson_name?: string | null;
}

export interface CustomerSearchResponse {
  items: CustomerSearchItem[];
  total: number;
}

export interface CustomerSiteVisitItem {
  id: string;
  visit_code: string;
  scheduled_at: string;
  visited_at?: string | null;
  status: string;
  verification_type?: string | null;
  outcome?: string | null;
  feedback_notes?: string | null;
  created_at: string;
}

export interface CustomerBookingItem {
  id: string;
  booking_reference: string;
  unit_number: string;
  unit_type: string;
  project_id: string;
  project_name: string;
  booking_date: string;
  booking_status: string;
  booking_value: number;
  token_amount: number;
  commission_rate_pct: number;
  commission_amount: number;
  cancelled_at?: string | null;
  created_at: string;
}

export interface CustomerDetailResponse {
  lead_id: string;
  lead_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  lead_status: string;
  budget_range?: string | null;
  requirement_type?: string | null;
  lost_reason?: string | null;
  created_at: string;
  qualified_at?: string | null;
  converted_at?: string | null;
  lost_at?: string | null;
  project_id: string;
  project_name: string;
  channel_partner_id: string;
  channel_partner_name: string;
  channel_partner_code?: string | null;
  channel_partner_tier?: string | null;
  salesperson_id?: string | null;
  salesperson_name?: string | null;
  salesperson_email?: string | null;
  salesperson_phone?: string | null;
  site_visits: CustomerSiteVisitItem[];
  bookings: CustomerBookingItem[];
}

const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Search customers across name, phone, email, or lead code.
 */
export async function searchCustomers(
  query: string,
  pageSize: number = 10
): Promise<CustomerSearchResponse> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { items: [], total: 0 };
  }

  const params = new URLSearchParams();
  params.set("q", trimmed);
  params.set("page_size", pageSize.toString());

  const url = `${API_BASE_URL}/api/v1/customers/search?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to search customers (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch full customer profile, attribution, visits, and booking history by lead ID.
 */
export async function fetchCustomerById(
  leadId: string
): Promise<CustomerDetailResponse> {
  if (!leadId) {
    throw new Error("leadId is required");
  }

  const url = `${API_BASE_URL}/api/v1/customers/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch customer details (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
