"""SQLAlchemy 2.0 database models for Channel Partner Intelligence.

Models:
- Salesperson (`salespeople`)
- Project (`projects`)
- ChannelPartner (`channel_partners`)
- Lead (`leads`)
- SiteVisit (`site_visits`)
- Booking (`bookings`)
- PartnerActivity (`partner_activities`)

Domain Semantics Enforced:
- Milestone-based qualification (`qualified_at IS NOT NULL`).
- Partial unique index ensuring at most 1 active booking (`Initiated`, `Confirmed`) per lead.
- Foreign keys and cross-entity consistency.
- Synthetic demo commission disclaimer flag.
"""

from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# ==============================================================================
# Domain Status Enums
# ==============================================================================


class ProjectStatus(str, enum.Enum):
    """Project lifecycle status."""

    UPCOMING = "Upcoming"
    ACTIVE = "Active"
    NEARLY_SOLD_OUT = "Nearly Sold Out"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"


class PartnerTier(str, enum.Enum):
    """Channel partner performance tier."""

    TIER_1 = "Tier 1"
    TIER_2 = "Tier 2"
    TIER_3 = "Tier 3"


class LeadStatus(str, enum.Enum):
    """Lead lifecycle status."""

    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    SITE_VISIT_SCHEDULED = "Site Visit Scheduled"
    SITE_VISIT_COMPLETED = "Site Visit Completed"
    BOOKING_INITIATED = "Booking Initiated"
    BOOKING_CONFIRMED = "Booking Confirmed"
    CONVERTED = "Converted"
    LOST = "Lost"
    INVALID = "Invalid"


class SiteVisitStatus(str, enum.Enum):
    """Site visit execution status."""

    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No Show"


class BookingStatus(str, enum.Enum):
    """Booking transaction status."""

    INITIATED = "Initiated"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"


class PartnerActivityType(str, enum.Enum):
    """Partner activity event types."""

    LEAD_SUBMITTED = "lead_submitted"
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    SITE_VISIT_COMPLETED = "site_visit_completed"
    BOOKING_INITIATED = "booking_initiated"
    BOOKING_CONFIRMED = "booking_confirmed"
    TIER_UPDATED = "tier_updated"
    REVIEW_LOGGED = "review_logged"
    FOLLOW_UP = "follow_up"
    MEETING = "meeting"


# ==============================================================================
# Database Models
# ==============================================================================


class Salesperson(Base):
    """Internal developer sales manager / relationship manager."""

    __tablename__ = "salespeople"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    team: Mapped[str] = mapped_column(String(100), default="Sales", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    channel_partners: Mapped[List[ChannelPartner]] = relationship(
        "ChannelPartner", back_populates="assigned_salesperson"
    )
    leads: Mapped[List[Lead]] = relationship(
        "Lead", back_populates="assigned_salesperson"
    )
    site_visits: Mapped[List[SiteVisit]] = relationship(
        "SiteVisit", back_populates="salesperson"
    )
    bookings: Mapped[List[Booking]] = relationship(
        "Booking", back_populates="salesperson"
    )

    def __repr__(self) -> str:
        return f"<Salesperson(id={self.id!r}, name={self.name!r}, active={self.active})>"


class Project(Base):
    """Real estate development asset marketed by the developer."""

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    project_type: Mapped[str] = mapped_column(
        String(50), default="Residential", nullable=False
    )
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default=ProjectStatus.ACTIVE.value, nullable=False
    )
    launch_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    target_units: Mapped[int] = mapped_column(Integer, nullable=False)
    available_units: Mapped[int] = mapped_column(Integer, nullable=False)
    starting_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    leads: Mapped[List[Lead]] = relationship("Lead", back_populates="project")
    site_visits: Mapped[List[SiteVisit]] = relationship(
        "SiteVisit", back_populates="project"
    )
    bookings: Mapped[List[Booking]] = relationship("Booking", back_populates="project")

    def __repr__(self) -> str:
        return f"<Project(id={self.id!r}, code={self.project_code!r}, name={self.name!r})>"


class ChannelPartner(Base):
    """External brokerage, real estate consultant, or independent agent."""

    __tablename__ = "channel_partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    partner_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_person: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    onboarding_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tier: Mapped[str] = mapped_column(
        String(20), default=PartnerTier.TIER_3.value, nullable=False
    )
    channel_type: Mapped[str] = mapped_column(
        String(50), default="Independent Broker", nullable=False
    )
    assigned_salesperson_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("salespeople.id"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    assigned_salesperson: Mapped[Optional[Salesperson]] = relationship(
        "Salesperson", back_populates="channel_partners"
    )
    leads: Mapped[List[Lead]] = relationship(
        "Lead", back_populates="channel_partner"
    )
    site_visits: Mapped[List[SiteVisit]] = relationship(
        "SiteVisit", back_populates="channel_partner"
    )
    bookings: Mapped[List[Booking]] = relationship(
        "Booking", back_populates="channel_partner"
    )
    activities: Mapped[List[PartnerActivity]] = relationship(
        "PartnerActivity", back_populates="channel_partner"
    )

    __table_args__ = (
        Index("idx_cp_tier", "tier"),
        Index("idx_cp_active", "active"),
    )

    def __repr__(self) -> str:
        return f"<ChannelPartner(id={self.id!r}, code={self.partner_code!r}, tier={self.tier!r})>"


class Lead(Base):
    """Prospective buyer referred by a channel partner for a specific project."""

    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    lead_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id"), nullable=False
    )
    channel_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("channel_partners.id"), nullable=False
    )
    assigned_salesperson_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("salespeople.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default=LeadStatus.NEW.value, nullable=False
    )
    budget_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    requirement_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lost_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    qualified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )  # Milestone timestamp
    converted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    lost_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="leads")
    channel_partner: Mapped[ChannelPartner] = relationship(
        "ChannelPartner", back_populates="leads"
    )
    assigned_salesperson: Mapped[Optional[Salesperson]] = relationship(
        "Salesperson", back_populates="leads"
    )
    site_visits: Mapped[List[SiteVisit]] = relationship(
        "SiteVisit", back_populates="lead", cascade="all, delete-orphan"
    )
    bookings: Mapped[List[Booking]] = relationship(
        "Booking", back_populates="lead", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_leads_partner", "channel_partner_id"),
        Index("idx_leads_project", "project_id"),
        Index("idx_leads_status", "status"),
        Index("idx_leads_created", "created_at"),
        Index("idx_leads_qualified", "qualified_at"),
    )

    def __repr__(self) -> str:
        return f"<Lead(id={self.id!r}, code={self.lead_code!r}, status={self.status!r})>"


class SiteVisit(Base):
    """In-person or virtual property tour conducted with a prospect."""

    __tablename__ = "site_visits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    visit_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    lead_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leads.id"), nullable=False
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id"), nullable=False
    )
    channel_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("channel_partners.id"), nullable=False
    )
    salesperson_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("salespeople.id"), nullable=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    visited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default=SiteVisitStatus.SCHEDULED.value, nullable=False
    )
    verification_type: Mapped[str] = mapped_column(
        String(50), default="Digital Token OTP", nullable=False
    )
    outcome: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    feedback_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    lead: Mapped[Lead] = relationship("Lead", back_populates="site_visits")
    project: Mapped[Project] = relationship("Project", back_populates="site_visits")
    channel_partner: Mapped[ChannelPartner] = relationship(
        "ChannelPartner", back_populates="site_visits"
    )
    salesperson: Mapped[Optional[Salesperson]] = relationship(
        "Salesperson", back_populates="site_visits"
    )

    __table_args__ = (
        Index("idx_sv_lead", "lead_id"),
        Index("idx_sv_partner", "channel_partner_id"),
        Index("idx_sv_project", "project_id"),
        Index("idx_sv_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<SiteVisit(id={self.id!r}, code={self.visit_code!r}, status={self.status!r})>"


class Booking(Base):
    """Executed transactional agreement and token reservation for a unit."""

    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    booking_reference: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    lead_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leads.id"), nullable=False
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id"), nullable=False
    )
    channel_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("channel_partners.id"), nullable=False
    )
    salesperson_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("salespeople.id"), nullable=False
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(50), nullable=False)
    booking_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    booking_status: Mapped[str] = mapped_column(
        String(30), default=BookingStatus.INITIATED.value, nullable=False
    )
    booking_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    token_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    commission_rate_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("2.0"), nullable=False
    )
    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False
    )
    is_synthetic_commission: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    lead: Mapped[Lead] = relationship("Lead", back_populates="bookings")
    project: Mapped[Project] = relationship("Project", back_populates="bookings")
    channel_partner: Mapped[ChannelPartner] = relationship(
        "ChannelPartner", back_populates="bookings"
    )
    salesperson: Mapped[Salesperson] = relationship(
        "Salesperson", back_populates="bookings"
    )

    __table_args__ = (
        Index("idx_bk_lead", "lead_id"),
        Index("idx_bk_partner", "channel_partner_id"),
        Index("idx_bk_project", "project_id"),
        Index("idx_bk_status", "booking_status"),
        Index("idx_bk_date", "booking_date"),
        # Partial unique index ensuring at most 1 active booking (Initiated or Confirmed) per lead
        Index(
            "idx_one_active_booking_per_lead",
            "lead_id",
            unique=True,
            sqlite_where=text("booking_status IN ('Initiated', 'Confirmed')"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Booking(id={self.id!r}, ref={self.booking_reference!r})>"


class PartnerActivity(Base):
    """Historical audit ledger capturing partner touchpoints and lifecycle events."""

    __tablename__ = "partner_activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    channel_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("channel_partners.id"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    channel_partner: Mapped[ChannelPartner] = relationship(
        "ChannelPartner", back_populates="activities"
    )

    __table_args__ = (
        Index("idx_pa_partner", "channel_partner_id"),
        Index("idx_pa_logged", "logged_at"),
    )

    def __repr__(self) -> str:
        return f"<PartnerActivity(id={self.id!r}, type={self.activity_type!r})>"
