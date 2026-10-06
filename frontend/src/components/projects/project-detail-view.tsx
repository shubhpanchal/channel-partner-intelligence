"use client";

import React from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck2,
  Layers,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useProjectDetail } from "@/hooks/use-projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/utils";

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
  onSelectPartner?: (partnerId: string) => void;
}

export function ProjectDetailView({
  projectId,
  onBack,
  onSelectPartner,
}: ProjectDetailViewProps) {
  const { data: project, isLoading, isError, error, refetch } = useProjectDetail(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-600 hover:text-slate-900"
          data-testid="back-to-projects-btn"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects Portfolio
        </Button>
        <LoadingState
          variant="skeleton"
          message="Loading project details..."
          description="Fetching unit inventory, funnel velocity, and partner contributions."
        />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-600 hover:text-slate-900"
          data-testid="back-to-projects-btn"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects Portfolio
        </Button>
        <ErrorState
          title="Unable to load project details"
          message={error?.message || "Project record could not be retrieved from the intelligence service."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const {
    inventory,
    lead_metrics,
    site_visit_metrics,
    booking_metrics,
    partner_metrics,
    monthly_trends = [],
    top_partners = [],
    recent_bookings = [],
  } = project;

  const getFamilyBadge = (family: string) => {
    switch (family) {
      case "Skyfinia":
        return (
          <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-semibold">
            Skyfinia
          </Badge>
        );
      case "Infinia":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-semibold">
            Infinia
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-semibold">
            {family}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
            Active
          </Badge>
        );
      case "Upcoming":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
            Upcoming
          </Badge>
        );
      case "Nearly Sold Out":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
            Nearly Sold Out
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-semibold">
            Completed
          </Badge>
        );
      case "On Hold":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold">
            On Hold
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "Tier 1":
        return "warning";
      case "Tier 2":
        return "info";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 text-slate-700 hover:text-slate-900 bg-white shadow-xs border-slate-200 w-fit"
          data-testid="back-to-projects-btn"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects Portfolio
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-200">
            Demo Environment · Synthetic Data
          </Badge>
          <div className="text-xs text-slate-500 font-mono">
            Code: <span className="font-semibold text-slate-700">{project.project_code}</span>
          </div>
        </div>
      </div>

      {/* 1. Project Profile Header Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Identity */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                  {project.project_code}
                </span>
                {getFamilyBadge(project.project_family)}
                {getStatusBadge(project.status)}
                <Badge variant="outline" className="text-slate-600">
                  {project.project_type}
                </Badge>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {project.location}, {project.city}
                  </span>
                  <span className="text-slate-300">·</span>
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Launch Date: {new Date(project.launch_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>

              <div className="pt-2 text-xs text-slate-600 flex flex-wrap items-center gap-4">
                <div>
                  Starting Price Floor:{" "}
                  <strong className="text-slate-900 font-semibold">
                    {formatCurrencyInr(project.starting_price)}
                  </strong>
                  <span className="text-slate-400 ml-1">(synthetic)</span>
                </div>
                <div className="text-slate-300">|</div>
                <div>
                  Active Channel Partners:{" "}
                  <strong className="text-indigo-600 font-semibold">
                    {partner_metrics.contributing_lead_partners} sourcing
                  </strong>
                  <span className="text-slate-500"> / </span>
                  <strong className="text-emerald-600 font-semibold">
                    {partner_metrics.contributing_booking_partners} closing
                  </strong>
                </div>
              </div>
            </div>

            {/* Right: Inventory Allocation Box */}
            <div className="lg:w-80 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 shrink-0 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  Inventory Allocation
                </span>
                <span className="font-bold text-slate-900">
                  {formatPercent(inventory.inventory_utilization_pct)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, inventory.inventory_utilization_pct))}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">Target</div>
                  <div className="text-sm font-bold text-slate-900">
                    {formatNumber(inventory.target_units)}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">Available</div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatNumber(inventory.available_units)}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">Booked</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatNumber(inventory.booked_units)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. KPI Summary Strip (6 Performance Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Leads */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Valid Leads</span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-xl font-bold tracking-tight text-slate-900" data-testid="kpi-valid-leads">
                {formatNumber(lead_metrics.valid_leads)}
              </div>
              <span className="text-[11px] text-slate-400">/ {lead_metrics.total_leads} total</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Inbound verified inquiries</p>
          </CardContent>
        </Card>

        {/* Card 2: Qualified Leads */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Qualified Leads</span>
              <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-xl font-bold tracking-tight text-slate-900" data-testid="kpi-qualified-leads">
                {formatNumber(lead_metrics.qualified_leads)}
              </div>
              <span className="text-[11px] font-semibold text-sky-600">
                {formatPercent(lead_metrics.qualification_rate_pct)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Milestone verified leads</p>
          </CardContent>
        </Card>

        {/* Card 3: Completed Visits */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Completed Visits</span>
              <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Eye className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-xl font-bold tracking-tight text-slate-900" data-testid="kpi-completed-visits">
                {formatNumber(site_visit_metrics.completed_visits)}
              </div>
              <span className="text-[11px] font-semibold text-amber-600">
                {formatPercent(site_visit_metrics.visit_completion_rate_pct)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {site_visit_metrics.unique_visited_leads} unique prospects
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Confirmed Bookings */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Bookings</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-xl font-bold tracking-tight text-slate-900" data-testid="kpi-confirmed-bookings">
                {formatNumber(booking_metrics.confirmed_bookings)}
              </div>
              <span className="text-[10px] text-slate-400">units</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {booking_metrics.visit_to_booking_rate_pct > 0
                ? `${formatPercent(booking_metrics.visit_to_booking_rate_pct)} visit → book`
                : "Confirmed unit closures"}
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Booking Value */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gross Value</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-lg font-bold tracking-tight text-slate-900 truncate" data-testid="kpi-booking-value">
                {formatCurrencyInr(booking_metrics.gross_booking_value_inr)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Confirmed & completed sales</p>
          </CardContent>
        </Card>

        {/* Card 6: Overall Conversion */}
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Overall Conv.</span>
              <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <div className="text-xl font-bold tracking-tight text-slate-900" data-testid="kpi-overall-conversion">
                {formatPercent(booking_metrics.overall_lead_to_booking_rate_pct)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Valid lead → booking</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Funnel Overview (4-Stage Flow) */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Project Funnel Velocity
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authoritative conversion stages from valid lead inbound to confirmed unit booking
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-medium text-slate-600">
              Deterministic SEED=42 Metrics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Stage 1: Valid Leads */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  1. Valid Leads
                </span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatNumber(lead_metrics.valid_leads)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  100% of valid inbound pipeline
                </div>
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
                  {formatNumber(lead_metrics.qualified_leads)}
                </div>
                <div className="text-[11px] text-sky-700 mt-0.5">
                  {formatPercent(lead_metrics.qualification_rate_pct)} qualification rate
                </div>
              </div>
              <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, lead_metrics.qualification_rate_pct))}%`,
                  }}
                />
              </div>
            </div>

            {/* Stage 3: Visited Prospects */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  3. Visited Prospects
                </span>
                <Eye className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-950">
                  {formatNumber(site_visit_metrics.unique_visited_leads)}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  {formatPercent(site_visit_metrics.qualified_lead_to_visit_rate_pct)} qual → visit rate
                </div>
              </div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, site_visit_metrics.qualified_lead_to_visit_rate_pct))}%`,
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
                  {formatNumber(booking_metrics.confirmed_bookings)}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  {formatPercent(booking_metrics.visit_to_booking_rate_pct)} visit → booking rate
                </div>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, booking_metrics.visit_to_booking_rate_pct))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Monthly Trend Chart (12 Months 2026) */}
      <Card className="border-slate-200/80 shadow-xs bg-white" data-testid="chart-project-monthly-trend">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Pipeline Velocity & Monthly Activity (2026)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chronological monthly progression across valid leads, completed visits, and bookings
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-slate-50">
              12 Months Logged
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            {monthly_trends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No monthly trend activity recorded for this project.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projLeadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="projVisitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="projBookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    fontSize={11}
                    tick={{ fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    fontSize={11}
                    tick={{ fill: "#64748b" }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Valid Leads"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#projLeadGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed_visits"
                    name="Completed Visits"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#projVisitGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="Confirmed Bookings"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#projBookingGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Top Channel Partners Contributing to this Project */}
      <Card className="border-slate-200/80 shadow-xs bg-white" data-testid="top-partners-card">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Top Contributing Channel Partners
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Leading brokerage firms delivering verified leads and confirmed bookings for {project.name}
              </CardDescription>
            </div>
            <Badge variant="neutral">{top_partners.length} Partners</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {top_partners.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No channel partner contributions recorded for this project yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[11px]">Partner</TableHead>
                    <TableHead className="text-[11px]">Tier</TableHead>
                    <TableHead className="text-[11px]">Assigned Manager</TableHead>
                    <TableHead className="text-right text-[11px]">Valid Leads</TableHead>
                    <TableHead className="text-right text-[11px]">Visits</TableHead>
                    <TableHead className="text-right text-[11px]">Bookings</TableHead>
                    <TableHead className="text-right text-[11px]">Booking Value</TableHead>
                    <TableHead className="text-right text-[11px]">Conversion</TableHead>
                    <TableHead className="w-12 text-center text-[11px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top_partners.map((tp) => (
                    <TableRow key={tp.partner_id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {tp.partner_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {tp.partner_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTierBadgeVariant(tp.tier)}>
                          {tp.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {tp.assigned_salesperson_name || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-800">
                        {formatNumber(tp.valid_leads)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-800">
                        {formatNumber(tp.completed_visits)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-emerald-700">
                        {formatNumber(tp.confirmed_bookings)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrencyInr(tp.booking_value_inr)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-700">
                        {formatPercent(tp.overall_conversion_rate_pct)}
                      </TableCell>
                      <TableCell className="text-center">
                        {onSelectPartner ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectPartner(tp.partner_id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600"
                            title="View Partner Profile"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Recent Project Bookings (Bounded Internal Viewport) */}
      <Card className="border-slate-200/80 shadow-xs bg-white flex flex-col" data-testid="recent-project-bookings-card">
        <CardHeader className="pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Recent Project Booking Closures
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Latest confirmed unit transactions for {project.name} (bounded viewport)
              </CardDescription>
            </div>
            <Badge variant="neutral">{recent_bookings.length} Closures</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          {recent_bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent confirmed bookings recorded for this project.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                  <TableRow>
                    <TableHead className="w-28 text-[11px]">Booking Ref</TableHead>
                    <TableHead className="text-[11px]">Customer</TableHead>
                    <TableHead className="text-[11px]">Channel Partner</TableHead>
                    <TableHead className="text-[11px]">Unit</TableHead>
                    <TableHead className="text-[11px]">Date</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-right text-[11px]">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_bookings.map((bk) => (
                    <TableRow key={bk.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {bk.booking_reference}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-900">
                        {bk.customer_name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {bk.channel_partner_name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        Unit {bk.unit_number}{" "}
                        <span className="text-[11px] text-slate-400">({bk.unit_type})</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(bk.booking_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[10px]">
                          {bk.booking_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrencyInr(bk.booking_value)}
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
