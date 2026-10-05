"use client";

import React from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Flame,
  Globe,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { usePartnerDetail } from "@/hooks/use-partners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/utils";

interface PartnerDetailViewProps {
  partnerId: string;
  onBack: () => void;
}

export function PartnerDetailView({ partnerId, onBack }: PartnerDetailViewProps) {
  const { data: partner, isLoading, isError, error, refetch } = usePartnerDetail(partnerId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Partners Directory
        </Button>
        <LoadingState
          variant="skeleton"
          message="Loading partner profile..."
          description="Fetching detailed performance analytics and transaction logs."
        />
      </div>
    );
  }

  if (isError || !partner) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Partners Directory
        </Button>
        <ErrorState
          title="Unable to load partner details"
          message={error?.message || "Partner record could not be retrieved from the intelligence service."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { metrics, assigned_salesperson } = partner;

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "Tier 1":
        return "warning"; // Amber/gold for Tier 1 Elite
      case "Tier 2":
        return "info"; // Sky/blue for Tier 2 Growth
      default:
        return "neutral"; // Slate for Tier 3
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "converted":
      case "confirmed":
      case "completed":
        return <Badge variant="success">{status}</Badge>;
      case "qualified":
      case "site visit scheduled":
      case "site visit completed":
      case "initiated":
      case "booking initiated":
        return <Badge variant="info">{status}</Badge>;
      case "contacted":
      case "new":
        return <Badge variant="neutral">{status}</Badge>;
      case "lost":
      case "invalid":
      case "cancelled":
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-700 hover:text-slate-900 bg-white shadow-xs border-slate-200"
          data-testid="back-to-directory-btn"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Partners Directory
        </Button>
        <div className="text-xs text-slate-500 font-mono">
          ID: <span className="font-semibold text-slate-700">{partner.id}</span>
        </div>
      </div>

      {/* Partner Profile Header Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Partner Identity */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                  {partner.partner_code}
                </span>
                <Badge variant={getTierBadgeVariant(partner.tier)}>
                  {partner.tier}
                </Badge>
                {partner.active ? (
                  <Badge variant="success" className="gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Account
                  </Badge>
                ) : (
                  <Badge variant="neutral">Inactive</Badge>
                )}
                <Badge variant="outline" className="text-slate-600">
                  {partner.channel_type}
                </Badge>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {partner.name}
                </h1>
                {partner.legal_name && partner.legal_name !== partner.name && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Legal Entity: <span className="font-medium text-slate-700">{partner.legal_name}</span>
                  </p>
                )}
              </div>

              {/* Location & Contact Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {partner.location}, {partner.city}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    Contact: <strong className="text-slate-800">{partner.contact_person}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{partner.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    Onboarded: {new Date(partner.onboarding_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Assigned Relationship Manager */}
            {assigned_salesperson ? (
              <div className="lg:w-72 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 shrink-0 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  Assigned Relationship Manager
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {assigned_salesperson.name}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{assigned_salesperson.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{assigned_salesperson.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:w-72 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 shrink-0 text-xs text-slate-500">
                No dedicated manager currently assigned.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Summary Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Leads</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900" data-testid="detail-total-leads">
                {formatNumber(metrics.total_leads)}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Raw prospects submitted
            </p>
          </CardContent>
        </Card>

        {/* Qualified Leads */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Qualified Leads</span>
              <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900" data-testid="detail-qualified-leads">
                {formatNumber(metrics.qualified_leads)}
              </div>
              <span className="text-xs font-semibold text-sky-600">
                {formatPercent(metrics.qualification_rate_pct)} qual.
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Passed milestone validation
            </p>
          </CardContent>
        </Card>

        {/* Completed Visits */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Completed Visits</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900" data-testid="detail-completed-visits">
                {formatNumber(metrics.completed_site_visits)}
              </div>
              <span className="text-xs font-semibold text-amber-600">
                {formatPercent(metrics.visit_completion_rate_pct)} rate
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.unique_visited_leads} unique visited prospects
            </p>
          </CardContent>
        </Card>

        {/* Confirmed Bookings */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Confirmed Bookings</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900" data-testid="detail-confirmed-bookings">
                {formatNumber(metrics.confirmed_bookings)}
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {formatCurrencyInr(metrics.gross_booking_value_inr)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Overall Conv: {formatPercent(metrics.overall_conversion_rate_pct)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4-Stage Conversion Funnel Flow */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Conversion Funnel Velocity
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                End-to-end pipeline progression from inbound referral to confirmed booking
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-medium text-slate-600">
              Deterministic SEED=42 Metrics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Stage 1: Inbound Leads */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  1. Inbound Leads
                </span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatNumber(metrics.total_leads)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% of pipeline volume</div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-700 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Stage 2: Milestone Qualified */}
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                  2. Qualified Leads
                </span>
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-950">
                  {formatNumber(metrics.qualified_leads)}
                </div>
                <div className="text-[11px] text-sky-700 mt-0.5">
                  {formatPercent(metrics.qualification_rate_pct)} qualification rate
                </div>
              </div>
              <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, metrics.qualification_rate_pct))}%`,
                  }}
                />
              </div>
            </div>

            {/* Stage 3: Completed Visits */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  3. Visited Prospects
                </span>
                <Eye className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-950">
                  {formatNumber(metrics.unique_visited_leads)}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  {formatPercent(metrics.qualified_lead_to_visit_rate_pct)} qual → visit rate
                </div>
              </div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, metrics.qualified_lead_to_visit_rate_pct))}%`,
                  }}
                />
              </div>
            </div>

            {/* Stage 4: Confirmed Closures */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  4. Confirmed Bookings
                </span>
                <FileCheck2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-950">
                  {formatNumber(metrics.confirmed_bookings)}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  {formatPercent(metrics.visit_to_booking_rate_pct)} visit → booking rate
                </div>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, metrics.visit_to_booking_rate_pct))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Conversion Rates Matrix */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <div className="text-[11px] text-slate-500 font-medium">Qualification Rate</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatPercent(metrics.qualification_rate_pct)}
              </div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <div className="text-[11px] text-slate-500 font-medium">Visit Completion</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatPercent(metrics.visit_completion_rate_pct)}
              </div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <div className="text-[11px] text-slate-500 font-medium">Qual → Visit Rate</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatPercent(metrics.qualified_lead_to_visit_rate_pct)}
              </div>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
              <div className="text-[11px] text-slate-500 font-medium">Visit → Booking Rate</div>
              <div className="text-base font-bold text-slate-900 mt-1" data-testid="detail-visit-to-booking-rate">
                {formatPercent(metrics.visit_to_booking_rate_pct)}
              </div>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/60">
              <div className="text-[11px] text-emerald-800 font-medium">Overall Conversion</div>
              <div className="text-base font-bold text-emerald-900 mt-1" data-testid="detail-overall-conversion-rate">
                {formatPercent(metrics.overall_conversion_rate_pct)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Leads & Recent Bookings Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Table */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Recent Inbound Leads
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Latest 10 prospect submissions (newest first)
                </CardDescription>
              </div>
              <Badge variant="neutral">{partner.recent_leads.length} Records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {partner.recent_leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent leads recorded for this partner.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Lead Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.recent_leads.map((ld) => (
                      <TableRow key={ld.id}>
                        <TableCell className="font-mono text-xs font-medium text-slate-700">
                          {ld.lead_code}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-slate-900">
                            {ld.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ld.customer_phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {ld.project_name}
                        </TableCell>
                        <TableCell>{getStatusBadge(ld.status)}</TableCell>
                        <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">
                          {new Date(ld.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings Table */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Recent Booking Closures
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Latest 10 unit purchase transactions (newest first)
                </CardDescription>
              </div>
              <Badge variant="neutral">{partner.recent_bookings.length} Records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {partner.recent_bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent booking transactions recorded for this partner.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Booking Ref</TableHead>
                      <TableHead>Customer / Unit</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.recent_bookings.map((bk) => (
                      <TableRow key={bk.id}>
                        <TableCell className="font-mono text-xs font-medium text-slate-700">
                          {bk.booking_reference}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-slate-900">
                            {bk.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Unit {bk.unit_number} ({bk.unit_type})
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {bk.project_name}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrencyInr(bk.booking_value)}
                        </TableCell>
                        <TableCell>{getStatusBadge(bk.booking_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Scoring Phase 3 Preview Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-center justify-between text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Algorithmic Partner Intelligence Scoring & Interventions</strong> — Coming in Phase 3.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
          Phase 3 Preview
        </span>
      </div>
    </div>
  );
}
