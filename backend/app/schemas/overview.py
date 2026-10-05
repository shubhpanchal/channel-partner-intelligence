"""Pydantic schemas for the Overview Summary API."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ActivePartnersBreakdown(BaseModel):
    """Breakdown of active partners across performance tiers."""

    tier_1: int = Field(0, description="Active partners in Tier 1")
    tier_2: int = Field(0, description="Active partners in Tier 2")
    tier_3: int = Field(0, description="Active partners in Tier 3")


class ActivePartnersKpi(BaseModel):
    """Active partners indicator with trailing 90-day activity qualification."""

    value: int = Field(
        ...,
        description="Count of active partners with >=1 qualifying activity in trailing 90 days",
    )
    growth_pct: Optional[float] = Field(
        None, description="Period-over-period growth percentage"
    )
    breakdown: ActivePartnersBreakdown = Field(
        default_factory=ActivePartnersBreakdown,
        description="Tier distribution of active partners",
    )


class ChannelLeadFlowKpi(BaseModel):
    """Channel lead volume and qualification rates."""

    value: int = Field(..., description="Total valid leads (status != 'Invalid')")
    total_leads: int = Field(..., description="Total raw leads received")
    valid_leads: int = Field(..., description="Valid leads count")
    qualified_leads: int = Field(
        ...,
        description="Milestone-qualified leads (qualified_at IS NOT NULL)",
    )
    qualification_rate_pct: float = Field(
        ..., description="Lead qualification rate percentage (Qualified / Valid * 100)"
    )
    growth_pct: Optional[float] = Field(
        None, description="Period-over-period growth percentage"
    )


class SiteVisitsKpi(BaseModel):
    """Site visit pipeline execution and conversion metrics."""

    total_scheduled: int = Field(..., description="Total scheduled site visits")
    total_completed: int = Field(
        ..., description="Total successfully completed site visits"
    )
    visit_completion_rate_pct: float = Field(
        ...,
        description="Visit Completion Rate: Completed / Scheduled * 100",
    )
    unique_visited_leads: int = Field(
        ..., description="Unique leads having >=1 completed site visit"
    )
    qualified_lead_to_visit_rate_pct: float = Field(
        ...,
        description="Qualified Lead -> Visit Rate: Visited Qualified Leads / Qualified Leads * 100",
    )
    growth_pct: Optional[float] = Field(
        None, description="Period-over-period growth percentage"
    )


class BookingsVelocityKpi(BaseModel):
    """Booking transaction volume, gross value, and close rates."""

    units_count: int = Field(
        ..., description="Total confirmed and completed booking units"
    )
    confirmed_bookings: int = Field(
        ..., description="Total confirmed and completed booking units"
    )
    confirmed_from_visited_leads: int = Field(
        ...,
        description="Confirmed bookings whose lead has >=1 completed site visit",
    )
    direct_confirmed_bookings: int = Field(
        ...,
        description="Direct confirmed bookings without prior completed site visit",
    )
    total_value_inr: float = Field(
        ..., description="Aggregate gross booking monetary value in INR"
    )
    visit_to_booking_rate_pct: float = Field(
        ...,
        description="Site Visit -> Booking Rate: Visited Bookings / Visited Leads * 100",
    )
    overall_conversion_rate_pct: float = Field(
        ...,
        description="Overall Lead -> Booking Rate: Confirmed Bookings / Valid Leads * 100",
    )
    growth_pct: Optional[float] = Field(
        None, description="Period-over-period growth percentage"
    )


class OverviewKpis(BaseModel):
    """Consolidated KPI indicators for executive dashboard."""

    active_partners: ActivePartnersKpi
    channel_lead_flow: ChannelLeadFlowKpi
    site_visits: SiteVisitsKpi
    bookings_velocity: BookingsVelocityKpi


class PartnerTierDistributionItem(BaseModel):
    """Partner tier distribution breakdown item."""

    tier: str = Field(..., description="Tier name (e.g., 'Tier 1 (Elite)')")
    partners_count: int = Field(
        ..., description="Count of channel partners in this tier"
    )
    percentage: float = Field(
        ..., description="Calculated percentage share of total partners"
    )
    contribution: str = Field(
        ..., description="Formatted contribution string (e.g., '10.3%')"
    )


class MonthlyTrendItem(BaseModel):
    """Monthly progression bucket for pipeline velocity trends."""

    month: str = Field(..., description="Formatted month label (e.g., 'Jan')")
    leads: int = Field(..., description="Valid leads ingested in this month")
    site_visits: int = Field(
        ..., description="Completed site visits conducted in this month"
    )
    bookings: int = Field(
        ..., description="Confirmed/completed bookings executed in this month"
    )


class RecentActivityItem(BaseModel):
    """Recent operational audit activity item."""

    id: str = Field(..., description="Activity record ID")
    partner_name: str = Field(..., description="Channel partner name")
    action: str = Field(..., description="Activity description")
    logged_at: datetime = Field(..., description="Timestamp of the event")
    time_ago: str = Field(
        ..., description="Formatted relative time string (e.g., '12m ago', '2h ago')"
    )
    status: str = Field(
        ...,
        description="UI badge status variant ('success', 'info', 'neutral', 'warning')",
    )
    tag: str = Field(
        ...,
        description="Activity tag (e.g., 'Lead Batch', 'Site Visit', 'Booking', 'Tier Update')",
    )


class AttentionAlertItem(BaseModel):
    """Deterministic operational alert or system notification."""

    id: str = Field(..., description="Alert identifier")
    title: str = Field(..., description="Alert headline")
    description: str = Field(..., description="Detailed explanation")
    severity: str = Field(
        ..., description="Severity level ('info', 'warning', 'critical')"
    )


class OverviewSummaryResponse(BaseModel):
    """Consolidated response contract for GET /api/v1/overview/summary."""

    kpis: OverviewKpis
    tier_breakdown: List[PartnerTierDistributionItem]
    monthly_trends: List[MonthlyTrendItem]
    recent_activities: List[RecentActivityItem]
    attention_alerts: List[AttentionAlertItem]

    model_config = ConfigDict(from_attributes=True)
