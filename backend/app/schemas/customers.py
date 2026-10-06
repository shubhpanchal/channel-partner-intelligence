"""Customer search and customer detail schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CustomerSearchItem(BaseModel):
    """Search result item representing a matched customer/lead."""

    model_config = ConfigDict(from_attributes=True)

    lead_id: str = Field(..., description="Unique lead identifier (e.g. ld-000067)")
    lead_code: str = Field(..., description="Business lead reference (e.g. LD-2026-000067)")
    customer_name: str = Field(..., description="Full customer name")
    customer_phone: str = Field(..., description="Contact phone number")
    customer_email: Optional[str] = Field(None, description="Customer email address")
    project_id: str = Field(..., description="Associated project identifier")
    project_name: str = Field(..., description="Project name")
    lead_status: str = Field(..., description="Current lead status")
    channel_partner_id: str = Field(..., description="Referring channel partner identifier")
    channel_partner_name: str = Field(..., description="Referring channel partner name")
    salesperson_id: Optional[str] = Field(None, description="Assigned relationship manager ID")
    salesperson_name: Optional[str] = Field(None, description="Assigned relationship manager name")


class CustomerSearchResponse(BaseModel):
    """Global customer search response."""

    items: List[CustomerSearchItem] = Field(
        default_factory=list, description="Matched customer leads"
    )
    total: int = Field(0, description="Total matching records count")


class CustomerSiteVisitItem(BaseModel):
    """Site visit record for a customer."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    visit_code: str
    scheduled_at: datetime
    visited_at: Optional[datetime] = None
    status: str
    verification_type: Optional[str] = None
    outcome: Optional[str] = None
    feedback_notes: Optional[str] = None
    created_at: datetime


class CustomerBookingItem(BaseModel):
    """Booking transaction record for a customer."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_reference: str
    unit_number: str
    unit_type: str
    project_id: str
    project_name: str
    booking_date: date
    booking_status: str
    booking_value: float
    token_amount: float
    commission_rate_pct: float
    commission_amount: float
    cancelled_at: Optional[datetime] = None
    created_at: datetime


class CustomerDetailResponse(BaseModel):
    """Comprehensive customer detail response for lifecycle investigation."""

    model_config = ConfigDict(from_attributes=True)

    # Customer Identity
    lead_id: str
    lead_code: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    lead_status: str
    budget_range: Optional[str] = None
    requirement_type: Optional[str] = None
    lost_reason: Optional[str] = None
    created_at: datetime
    qualified_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    lost_at: Optional[datetime] = None

    # Attribution
    project_id: str
    project_name: str
    channel_partner_id: str
    channel_partner_name: str
    channel_partner_code: Optional[str] = None
    channel_partner_tier: Optional[str] = None
    salesperson_id: Optional[str] = None
    salesperson_name: Optional[str] = None
    salesperson_email: Optional[str] = None
    salesperson_phone: Optional[str] = None

    # History
    site_visits: List[CustomerSiteVisitItem] = Field(default_factory=list)
    bookings: List[CustomerBookingItem] = Field(default_factory=list)
