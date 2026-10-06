"""Pydantic schemas for Projects API."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==============================================================================
# Shared / Pagination Schemas
# ==============================================================================


class PaginationMetadata(BaseModel):
    """Standardized 1-indexed pagination metadata."""

    total: int = Field(..., description="Total count of matching records across all pages")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of records per page")
    total_pages: int = Field(..., description="Total available pages")


class ProjectSummaryMetrics(BaseModel):
    """Database-derived summary performance metrics for project cards/rows."""

    target_units: int = Field(0, description="Total planned saleable units")
    available_units: int = Field(0, description="Synthetic available inventory units")
    booked_units: int = Field(0, description="Confirmed or completed booking units")
    inventory_utilization_pct: float = Field(
        0.0, description="Percentage of target inventory booked"
    )
    total_leads: int = Field(0, description="Total leads submitted for this project")
    valid_leads: int = Field(0, description="Valid leads (status != Invalid)")
    qualified_leads: int = Field(
        0, description="Milestone-qualified leads (qualified_at IS NOT NULL)"
    )
    qualification_rate_pct: float = Field(
        0.0, description="Qualified Leads / Valid Leads * 100"
    )
    completed_visits: int = Field(0, description="Successfully completed site visits")
    confirmed_bookings: int = Field(0, description="Confirmed or completed bookings")
    gross_booking_value_inr: float = Field(
        0.0, description="Total revenue agreement value in INR"
    )
    overall_conversion_rate_pct: float = Field(
        0.0, description="Overall Lead -> Booking Rate: Confirmed Bookings / Valid Leads * 100"
    )


class ProjectPortfolioSummary(BaseModel):
    """Network-wide summary strip metrics for Projects Portfolio view."""

    total_projects: int = Field(4, description="Total registered projects")
    total_families: int = Field(2, description="Total project families (Skyfinia, Infinia)")
    total_target_units: int = Field(0, description="Aggregate target saleable units")
    total_available_units: int = Field(0, description="Aggregate available units")
    total_booked_units: int = Field(0, description="Aggregate booked units")
    total_booking_value_inr: float = Field(
        0.0, description="Aggregate sales value in INR"
    )


# ==============================================================================
# Project List View Schemas
# ==============================================================================


class ProjectListItem(BaseModel):
    """Project directory card/row representation."""

    id: str = Field(..., description="Project identifier (e.g. 'prj-sky-p1')")
    project_code: str = Field(..., description="Business project code (e.g. 'PRJ-SKY-P1')")
    name: str = Field(..., description="Commercial project name (e.g. 'Skyfinia Phase 1')")
    project_family: str = Field(..., description="Project family ('Skyfinia', 'Infinia')")
    project_type: str = Field(..., description="Project asset type (e.g. 'Residential')")
    location: str = Field(..., description="Locality (e.g. 'Tathawade')")
    city: str = Field(..., description="Metropolitan city (e.g. 'Pune')")
    status: str = Field(..., description="Project lifecycle status (e.g. 'Active')")
    launch_date: date = Field(..., description="Official commercial launch date")
    target_units: int = Field(..., description="Total planned units")
    available_units: int = Field(..., description="Current available units")
    starting_price: float = Field(..., description="Starting unit price in INR")
    metrics: ProjectSummaryMetrics = Field(
        default_factory=ProjectSummaryMetrics,
        description="Aggregated project performance metrics",
    )

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    """Response contract for GET /api/v1/projects."""

    items: List[ProjectListItem] = Field(
        default_factory=list, description="Paginated project cards/rows"
    )
    pagination: PaginationMetadata = Field(..., description="Pagination metadata")
    portfolio_summary: ProjectPortfolioSummary = Field(
        ..., description="Portfolio-wide summary indicators"
    )


# ==============================================================================
# Project Detail View Schemas
# ==============================================================================


class ProjectInventoryMetrics(BaseModel):
    """Inventory utilization indicators for Project Detail view."""

    target_units: int = Field(..., description="Total target units")
    available_units: int = Field(..., description="Available unsold units")
    booked_units: int = Field(..., description="Confirmed + completed booked units")
    inventory_utilization_pct: float = Field(
        ..., description="Booked Units / Target Units * 100"
    )


class ProjectLeadMetrics(BaseModel):
    """Lead volume and qualification indicators for Project Detail view."""

    total_leads: int = Field(..., description="Total leads submitted for this project")
    valid_leads: int = Field(..., description="Valid leads (status != 'Invalid')")
    qualified_leads: int = Field(
        ..., description="Milestone-qualified leads (qualified_at IS NOT NULL)"
    )
    qualification_rate_pct: float = Field(
        ..., description="Qualified Leads / Valid Leads * 100"
    )


class ProjectSiteVisitMetrics(BaseModel):
    """Site visit footfall and conversion indicators for Project Detail view."""

    scheduled_visits: int = Field(..., description="Total scheduled visits")
    completed_visits: int = Field(..., description="Successfully conducted visits")
    visit_completion_rate_pct: float = Field(
        ..., description="Completed Visits / Scheduled Visits * 100"
    )
    unique_visited_leads: int = Field(
        ..., description="Unique leads with >= 1 completed site visit"
    )
    qualified_lead_to_visit_rate_pct: float = Field(
        ..., description="Unique Visited Qualified Leads / Qualified Leads * 100"
    )


class ProjectBookingMetrics(BaseModel):
    """Sales velocity and conversion indicators for Project Detail view."""

    confirmed_bookings: int = Field(
        ..., description="Total confirmed + completed bookings"
    )
    confirmed_from_visited_leads: int = Field(
        ..., description="Confirmed bookings with prior completed site visit"
    )
    direct_confirmed_bookings: int = Field(
        0, description="Confirmed bookings without prior completed site visit"
    )
    visit_to_booking_rate_pct: float = Field(
        ...,
        description="Site Visit -> Booking Rate: Visited Bookings / Visited Leads * 100",
    )
    overall_lead_to_booking_rate_pct: float = Field(
        ...,
        description="Overall Lead -> Booking Rate: Confirmed Bookings / Valid Leads * 100",
    )
    gross_booking_value_inr: float = Field(
        ..., description="Aggregate monetary value of confirmed bookings"
    )


class ProjectPartnerMetrics(BaseModel):
    """Partner engagement breadth for Project Detail view."""

    contributing_lead_partners: int = Field(
        ..., description="Count of unique partners submitting valid leads for this project"
    )
    contributing_booking_partners: int = Field(
        ..., description="Count of unique partners generating confirmed bookings"
    )


class ProjectMonthlyTrendItem(BaseModel):
    """Single month progression for project funnel timeline charts."""

    month: str = Field(..., description="3-letter month abbreviation (e.g. 'Jan')")
    leads: int = Field(..., description="Valid leads created in this month")
    completed_visits: int = Field(..., description="Completed visits executed in this month")
    bookings: int = Field(..., description="Confirmed + completed bookings in this month")


class ProjectTopPartnerItem(BaseModel):
    """Contributing channel partner ranking item for Project Detail view."""

    partner_id: str = Field(..., description="Channel partner ID")
    partner_code: str = Field(..., description="Partner code (e.g. 'CP-1001')")
    partner_name: str = Field(..., description="Agency commercial name")
    tier: str = Field(..., description="Partner tier ('Tier 1', 'Tier 2', 'Tier 3')")
    assigned_salesperson_name: Optional[str] = Field(
        None, description="Assigned developer relationship manager"
    )
    valid_leads: int = Field(..., description="Valid leads submitted for this project")
    completed_visits: int = Field(..., description="Completed visits conducted for this project")
    confirmed_bookings: int = Field(
        ..., description="Confirmed bookings generated for this project"
    )
    booking_value_inr: float = Field(
        ..., description="Total sales value generated for this project"
    )
    overall_conversion_rate_pct: float = Field(
        ..., description="Confirmed Bookings / Valid Leads * 100"
    )


class ProjectRecentBookingItem(BaseModel):
    """Recent confirmed booking closure transaction for Project Detail view."""

    id: str = Field(..., description="Booking ID")
    booking_reference: str = Field(
        ..., description="Booking business reference (e.g. 'BK-2026-000015')"
    )
    lead_id: str = Field(..., description="Associated customer lead ID")
    customer_name: str = Field(..., description="Customer full name")
    channel_partner_id: str = Field(..., description="Referring channel partner ID")
    channel_partner_name: str = Field(..., description="Referring channel partner name")
    unit_number: str = Field(..., description="Unit descriptor (e.g. 'Unit 1706')")
    unit_type: str = Field(..., description="Unit layout (e.g. '3 BHK Luxury')")
    booking_date: date = Field(..., description="Booking business date")
    booking_status: str = Field(..., description="Booking status ('Confirmed', 'Completed')")
    booking_value: float = Field(..., description="Booking agreement value in INR")

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailResponse(BaseModel):
    """Comprehensive response contract for GET /api/v1/projects/{id}."""

    id: str = Field(..., description="Project unique identifier")
    project_code: str = Field(..., description="Project business code")
    name: str = Field(..., description="Project name")
    project_family: str = Field(..., description="Project family ('Skyfinia', 'Infinia')")
    project_type: str = Field(..., description="Project asset type")
    location: str = Field(..., description="Locality / neighborhood")
    city: str = Field(..., description="Operating city")
    status: str = Field(..., description="Project status")
    launch_date: date = Field(..., description="Launch date")
    target_units: int = Field(..., description="Total planned units")
    available_units: int = Field(..., description="Synthetic available inventory units")
    starting_price: float = Field(..., description="Starting unit price in INR")

    inventory: ProjectInventoryMetrics = Field(..., description="Inventory utilization")
    lead_metrics: ProjectLeadMetrics = Field(..., description="Lead metrics")
    site_visit_metrics: ProjectSiteVisitMetrics = Field(..., description="Site visit metrics")
    booking_metrics: ProjectBookingMetrics = Field(..., description="Booking metrics")
    partner_metrics: ProjectPartnerMetrics = Field(..., description="Partner metrics")
    monthly_trends: List[ProjectMonthlyTrendItem] = Field(
        default_factory=list, description="12-month 2026 chronological progression"
    )
    top_partners: List[ProjectTopPartnerItem] = Field(
        default_factory=list, description="Top contributing channel partners"
    )
    recent_bookings: List[ProjectRecentBookingItem] = Field(
        default_factory=list, description="Recent confirmed booking closures"
    )

    model_config = ConfigDict(from_attributes=True)
