"""Pydantic schemas for Channel Partners API."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==============================================================================
# Shared / Nested Schemas
# ==============================================================================


class SalespersonBasic(BaseModel):
    """Basic sales manager representation."""

    id: str = Field(..., description="Salesperson ID")
    name: str = Field(..., description="Salesperson full name")

    model_config = ConfigDict(from_attributes=True)


class SalespersonDetail(BaseModel):
    """Detailed sales manager representation."""

    id: str = Field(..., description="Salesperson ID")
    name: str = Field(..., description="Salesperson full name")
    email: str = Field(..., description="Corporate email address")
    phone: str = Field(..., description="Contact phone number")

    model_config = ConfigDict(from_attributes=True)


class PaginationMetadata(BaseModel):
    """Standardized 1-indexed pagination metadata."""

    total: int = Field(..., description="Total count of matching records across all pages")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of records per page")
    total_pages: int = Field(..., description="Total available pages")


class PartnerSummaryStats(BaseModel):
    """Database-derived summary performance statistics for list views."""

    total_leads: int = Field(0, description="Total leads submitted by this partner")
    qualified_leads: int = Field(
        0, description="Milestone-qualified leads (qualified_at IS NOT NULL)"
    )
    completed_visits: int = Field(0, description="Successfully completed site visits")
    confirmed_bookings: int = Field(0, description="Confirmed or completed bookings")
    visit_to_booking_rate_pct: float = Field(
        0.0,
        description="Site Visit -> Booking Rate: Visited Bookings / Visited Leads * 100",
    )
    overall_conversion_rate_pct: float = Field(
        0.0,
        description="Overall Lead -> Booking Rate: Confirmed Bookings / Valid Leads * 100",
    )


# ==============================================================================
# Partner List View Schemas
# ==============================================================================


class PartnerListItem(BaseModel):
    """Partner directory card/row representation."""

    id: str = Field(..., description="Partner identifier")
    partner_code: str = Field(..., description="Business partner code (e.g. 'CP-1001')")
    name: str = Field(..., description="Commercial agency / broker name")
    legal_name: Optional[str] = Field(
        None, description="Registered corporate legal entity name"
    )
    contact_person: str = Field(..., description="Principal contact representative")
    phone: str = Field(..., description="Primary phone number")
    email: str = Field(..., description="Primary email address")
    city: str = Field(..., description="Operational city")
    location: str = Field(..., description="Local micro-market or neighborhood")
    onboarding_date: date = Field(..., description="Date of partner onboarding")
    active: bool = Field(..., description="Underlying partner account status")
    tier: str = Field(..., description="Business tier ('Tier 1', 'Tier 2', 'Tier 3')")
    channel_type: str = Field(
        ..., description="Agency type ('Corporate Agency', 'Independent Broker', etc.)"
    )
    assigned_salesperson: Optional[SalespersonBasic] = Field(
        None, description="Assigned relationship manager"
    )
    summary_stats: PartnerSummaryStats = Field(
        default_factory=PartnerSummaryStats,
        description="Consolidated performance summary statistics",
    )

    model_config = ConfigDict(from_attributes=True)


class PartnerListResponse(BaseModel):
    """Response contract for GET /api/v1/partners."""

    items: List[PartnerListItem] = Field(
        ..., description="List of partner items on the current page"
    )
    pagination: PaginationMetadata = Field(..., description="Pagination metadata")

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Partner Detail View Schemas
# ==============================================================================


class PartnerDetailedMetrics(BaseModel):
    """Comprehensive performance metrics for partner detail view."""

    total_leads: int = Field(0, description="Total raw leads received")
    qualified_leads: int = Field(
        0, description="Milestone-qualified leads (qualified_at IS NOT NULL)"
    )
    qualification_rate_pct: float = Field(
        0.0, description="Lead qualification rate percentage"
    )
    scheduled_site_visits: int = Field(0, description="Total scheduled site visits")
    completed_site_visits: int = Field(0, description="Total completed site visits")
    visit_completion_rate_pct: float = Field(
        0.0, description="Visit Completion Rate: Completed / Scheduled * 100"
    )
    unique_visited_leads: int = Field(
        0, description="Unique leads having >=1 completed site visit"
    )
    qualified_lead_to_visit_rate_pct: float = Field(
        0.0,
        description="Qualified Lead -> Visit Rate: Visited Qualified Leads / Qualified Leads * 100",
    )
    confirmed_bookings: int = Field(0, description="Total confirmed/completed bookings")
    visit_to_booking_rate_pct: float = Field(
        0.0,
        description="Site Visit -> Booking Rate: Visited Bookings / Visited Leads * 100",
    )
    overall_conversion_rate_pct: float = Field(
        0.0,
        description="Overall Lead -> Booking Rate: Confirmed Bookings / Valid Leads * 100",
    )
    gross_booking_value_inr: float = Field(
        0.0, description="Gross monetary booking value generated in INR"
    )


class PartnerRecentLeadItem(BaseModel):
    """Recent lead submitted by partner."""

    id: str = Field(..., description="Lead ID")
    lead_code: str = Field(..., description="Lead code (e.g. 'LD-2026-000001')")
    customer_name: str = Field(..., description="Prospective customer name")
    customer_phone: str = Field(..., description="Customer phone number")
    customer_email: Optional[str] = Field(None, description="Customer email address")
    project_id: str = Field(..., description="Target project ID")
    project_name: str = Field(..., description="Target project name")
    status: str = Field(..., description="Current lead lifecycle status")
    budget_range: Optional[str] = Field(None, description="Customer budget bracket")
    requirement_type: Optional[str] = Field(None, description="Unit type requirement")
    created_at: datetime = Field(..., description="Lead submission timestamp")
    qualified_at: Optional[datetime] = Field(
        None, description="Milestone qualification timestamp"
    )

    model_config = ConfigDict(from_attributes=True)


class PartnerRecentBookingItem(BaseModel):
    """Recent booking generated by partner."""

    id: str = Field(..., description="Booking ID")
    booking_reference: str = Field(
        ..., description="Booking reference code (e.g. 'BK-2026-000001')"
    )
    lead_id: str = Field(..., description="Associated lead ID")
    customer_name: str = Field(..., description="Customer full name")
    project_id: str = Field(..., description="Project ID")
    project_name: str = Field(..., description="Project name")
    unit_number: str = Field(..., description="Unit identifier")
    unit_type: str = Field(..., description="Unit configuration type")
    booking_date: date = Field(..., description="Transaction execution date")
    booking_status: str = Field(
        ..., description="Booking status ('Confirmed', 'Completed', etc.)"
    )
    booking_value: float = Field(..., description="Gross unit booking value in INR")
    token_amount: float = Field(..., description="Token advance paid in INR")
    commission_rate_pct: float = Field(..., description="Commission rate percentage")
    commission_amount: float = Field(
        ..., description="Estimated commission amount in INR"
    )
    salesperson_name: str = Field(..., description="Handling internal sales manager")
    created_at: datetime = Field(..., description="Booking creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class PartnerDetailResponse(BaseModel):
    """Response contract for GET /api/v1/partners/{id}."""

    id: str = Field(..., description="Partner identifier")
    partner_code: str = Field(..., description="Partner code")
    name: str = Field(..., description="Partner name")
    legal_name: Optional[str] = Field(None, description="Legal business entity name")
    contact_person: str = Field(..., description="Contact person")
    phone: str = Field(..., description="Phone number")
    email: str = Field(..., description="Email address")
    city: str = Field(..., description="City")
    location: str = Field(..., description="Location / neighborhood")
    onboarding_date: date = Field(..., description="Onboarding date")
    active: bool = Field(..., description="Partner account status")
    tier: str = Field(..., description="Assigned business tier")
    channel_type: str = Field(..., description="Channel type classification")
    notes: Optional[str] = Field(None, description="Internal relationship notes")
    assigned_salesperson: Optional[SalespersonDetail] = Field(
        None, description="Assigned sales manager"
    )
    metrics: PartnerDetailedMetrics = Field(
        default_factory=PartnerDetailedMetrics,
        description="Comprehensive funnel and conversion metrics",
    )
    recent_leads: List[PartnerRecentLeadItem] = Field(
        default_factory=list,
        description="Recent lead submissions (newest first)",
    )
    recent_bookings: List[PartnerRecentBookingItem] = Field(
        default_factory=list,
        description="Recent booking transactions (newest first)",
    )

    model_config = ConfigDict(from_attributes=True)
