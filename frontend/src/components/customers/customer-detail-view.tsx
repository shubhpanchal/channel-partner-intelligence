"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Tag,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useCustomerDetail } from "@/hooks/use-customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { formatCurrencyInr, formatDate, formatDateTime, formatNumber } from "@/lib/utils";

interface CustomerDetailViewProps {
  leadId: string;
}

export function CustomerDetailView({ leadId }: CustomerDetailViewProps) {
  const router = useRouter();
  const { data: customer, isLoading, isError, error, refetch } = useCustomerDetail(leadId);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="customer-detail-loading">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <LoadingState
          variant="skeleton"
          message="Loading customer profile..."
          description="Fetching lead attribution, site visit logs, and booking lifecycle history."
        />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6" data-testid="customer-detail-error">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <ErrorState
          title="Customer Profile Not Found"
          message={error?.message || `Unable to load customer lead with ID: ${leadId}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case "Converted":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Converted</Badge>;
      case "Booking Initiated":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Booking Initiated</Badge>;
      case "Site Visit Completed":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Site Visit Completed</Badge>;
      case "Site Visit Scheduled":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-300">Site Visit Scheduled</Badge>;
      case "Qualified":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">Qualified</Badge>;
      case "Lost":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Lost</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">{status}</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
      case "Completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
            {status}
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="mr-1 h-3 w-3 text-rose-600" />
            Cancelled
          </span>
        );
      case "Draft":
      case "Pending Verification":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="mr-1 h-3 w-3 text-amber-600" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Check if multiple bookings exist for replacement scenario
  const hasReplacementScenario = customer.bookings.length > 1;

  return (
    <div className="space-y-6" data-testid="customer-detail-view">
      {/* Top Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2 text-slate-600 hover:text-slate-900 w-fit"
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Lead Reference:</span>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {customer.lead_code}
          </span>
        </div>
      </div>

      {/* Customer Header Identity Card */}
      <Card className="border-border bg-white shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  data-testid="customer-name-heading"
                  className="text-2xl font-bold tracking-tight text-slate-900"
                >
                  {customer.customer_name}
                </h1>
                {getLeadStatusBadge(customer.lead_status)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{customer.customer_phone}</span>
                </span>
                {customer.customer_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{customer.customer_email}</span>
                  </span>
                )}
                {customer.requirement_type && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>{customer.requirement_type}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Ingested {formatDate(customer.created_at)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/?section=partners&partnerId=${customer.channel_partner_id}`)}
                className="gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                data-testid="view-partner-profile-btn"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Partner: {customer.channel_partner_name}</span>
                <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attribution Grid (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Card */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              Project Attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900 text-sm">{customer.project_name}</div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Project ID</span>
              <span className="font-mono text-slate-700">{customer.project_id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Location / City</span>
              <span className="text-slate-700">Pune, Maharashtra</span>
            </div>
          </CardContent>
        </Card>

        {/* Partner Card */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              Referring Channel Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
              <span>{customer.channel_partner_name}</span>
              {customer.channel_partner_tier && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {customer.channel_partner_tier}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Partner Code</span>
              <span className="font-mono text-slate-700">
                {customer.channel_partner_code || customer.channel_partner_id}
              </span>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push(`/?section=partners&partnerId=${customer.channel_partner_id}`)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View partner metrics & history →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Manager Card */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Relationship Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900 text-sm">
              {customer.salesperson_name || "Unassigned"}
            </div>
            {customer.salesperson_email && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Email</span>
                <span className="text-slate-700 truncate max-w-[180px]">
                  {customer.salesperson_email}
                </span>
              </div>
            )}
            {customer.salesperson_phone && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Phone</span>
                <span className="text-slate-700">{customer.salesperson_phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking History & Unit Replacement Lifecycle */}
      <Card className="border-border bg-white shadow-2xs" data-testid="booking-history-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-blue-600" />
                Booking & Lifecycle History
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chronological booking transaction records and unit allocation transitions
              </CardDescription>
            </div>
            {hasReplacementScenario && (
              <span
                data-testid="replacement-lifecycle-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                Unit Replacement Lifecycle Detected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(!customer.lifecycle_events || customer.lifecycle_events.length === 0) &&
          customer.bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No booking transactions recorded for this customer yet.
            </div>
          ) : (
            <div>
              {/* Chronological Lifecycle Timeline (Primary Visual Representation) */}
              {customer.lifecycle_events && customer.lifecycle_events.length > 0 && (
                <div
                  data-testid="lifecycle-timeline-section"
                  className="p-6 bg-slate-50/50 border-b border-border"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Booking Lifecycle Journey ({customer.lifecycle_events.length}{" "}
                    {customer.lifecycle_events.length === 1 ? "Event" : "Events"})
                  </div>

                  {/* Responsive Timeline Grid */}
                  <div
                    data-testid="lifecycle-events-timeline"
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 relative"
                  >
                    {customer.lifecycle_events.map((event, idx) => {
                      const isCancelled = event.event_type === "BOOKING_CANCELLED";
                      const isConfirmed =
                        event.event_type === "BOOKING_CONFIRMED" ||
                        event.event_type === "BOOKING_COMPLETED";

                      let eventTitle = "Booking Attempted";
                      if (isCancelled) {
                        eventTitle = "Booking Cancelled";
                      } else if (isConfirmed) {
                        eventTitle = event.is_replacement
                          ? "Replacement Booking Confirmed"
                          : "Booking Confirmed";
                      }

                      return (
                        <div
                          key={event.event_id}
                          data-testid={`lifecycle-event-${idx}`}
                          className="flex flex-col relative group"
                        >
                          <div
                            className={`rounded-xl p-4 border transition-all shadow-2xs h-full flex flex-col justify-between ${
                              isCancelled
                                ? "bg-rose-50/70 border-rose-200 text-rose-950 hover:border-rose-300"
                                : isConfirmed
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:border-emerald-300"
                                : "bg-blue-50/60 border-blue-200 text-blue-950 hover:border-blue-300"
                            }`}
                          >
                            <div>
                              {/* Event Header with Icon, Title, and Step */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                                  {isCancelled ? (
                                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                  ) : isConfirmed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                  )}
                                  <span
                                    className={
                                      isCancelled
                                        ? "text-rose-900"
                                        : isConfirmed
                                        ? "text-emerald-900"
                                        : "text-blue-900"
                                    }
                                  >
                                    {eventTitle}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/80 text-slate-600 font-semibold">
                                  Step {idx + 1}
                                </span>
                              </div>

                              {/* Formatted Date & Time */}
                              <div className="text-xs font-medium text-slate-600 mb-3 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{formatDateTime(event.event_at)}</span>
                              </div>

                              {/* Booking & Unit Details */}
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Booking:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {event.booking_reference}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Unit:</span>
                                  <span className="font-bold text-slate-900">
                                    {event.unit_number}
                                  </span>
                                </div>
                                {event.unit_type && (
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-500">Unit Type:</span>
                                    <span>{event.unit_type}</span>
                                  </div>
                                )}
                                {event.project_name && (
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-500">Project:</span>
                                    <span className="font-medium text-slate-800 truncate max-w-[150px]">
                                      {event.project_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Event Bottom Status Detail */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px]">
                              {isCancelled ? (
                                <div className="font-semibold text-rose-700 flex items-center justify-between">
                                  <span>Status: Cancelled</span>
                                  <span className="text-rose-600 text-[10px] bg-rose-100/60 px-1.5 py-0.5 rounded border border-rose-200">
                                    Cancellation recorded
                                  </span>
                                </div>
                              ) : isConfirmed ? (
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="text-emerald-700">Status: {event.booking_status}</span>
                                  <span className="text-slate-900">
                                    {formatCurrencyInr(event.booking_value)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="text-blue-700">Status: Attempted</span>
                                  <span className="text-slate-900">
                                    {formatCurrencyInr(event.booking_value)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Raw Booking Records Table Header */}
              <div className="px-6 py-3 bg-slate-50/80 border-b border-border flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">
                  Raw Booking Records ({customer.bookings.length})
                </div>
                <div className="text-[11px] text-slate-500">
                  Underlying database transactions and contract values
                </div>
              </div>

              {/* Detailed Bookings Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-700">Booking Ref</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Unit</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Project</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Attempt Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Lifecycle Details</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        data-testid={`customer-booking-row-${booking.id}`}
                        className="hover:bg-slate-50/60"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-slate-900">
                          {booking.booking_reference}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-slate-900">{booking.unit_number}</div>
                          <div className="text-[11px] text-slate-500">{booking.unit_type}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {booking.project_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <div>{formatDate(booking.booking_date)}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(booking.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {getBookingStatusBadge(booking.booking_status)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {booking.cancelled_at ? (
                            <div className="text-rose-700">
                              <span className="font-semibold">Cancellation:</span>{" "}
                              <span>{formatDateTime(booking.cancelled_at)}</span>
                            </div>
                          ) : (
                            <div className="text-emerald-700 font-medium">
                              Active Confirmed Closure
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900 text-right">
                          {formatCurrencyInr(booking.booking_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Visit History */}
      <Card className="border-border bg-white shadow-2xs" data-testid="site-visit-history-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Site Visit History ({customer.site_visits.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Scheduled on-site property walkthroughs and verification tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {customer.site_visits.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No site visits logged for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-700">Visit Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Scheduled Time</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Visited Time</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Outcome</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.site_visits.map((sv) => (
                    <TableRow key={sv.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        {sv.visit_code}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDateTime(sv.scheduled_at)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {sv.visited_at ? formatDateTime(sv.visited_at) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sv.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : sv.status === "Scheduled"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {sv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                            sv.outcome === "Positive"
                              ? "bg-emerald-50 text-emerald-700"
                              : sv.outcome === "Neutral"
                              ? "bg-slate-100 text-slate-700"
                              : sv.outcome === "Negative"
                              ? "bg-rose-50 text-rose-700"
                              : "text-slate-400"
                          }`}
                        >
                          {sv.outcome || "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {sv.feedback_notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
