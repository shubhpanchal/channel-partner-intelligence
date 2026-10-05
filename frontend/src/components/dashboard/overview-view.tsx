"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  CalendarCheck,
  Award,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/common/empty-state";
import { useOverviewSummary } from "@/hooks/use-overview-summary";
import { OverviewSummaryFilters } from "@/lib/api/overview";
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

interface OverviewViewProps {
  filters?: OverviewSummaryFilters;
}

export function OverviewView({ filters }: OverviewViewProps = {}) {
  const { data, isLoading, isError, error, refetch } = useOverviewSummary(filters);

  if (isLoading) {
    return (
      <div className="py-12" data-testid="overview-loading-state">
        <LoadingState message="Loading channel partner intelligence overview..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8" data-testid="overview-error-state">
        <ErrorState
          title="Unable to Load Overview Data"
          message={error?.message || "An unexpected error occurred while loading overview metrics."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8" data-testid="overview-empty-state">
        <EmptyState
          title="No Overview Data"
          description="No operational channel metrics were found for the selected criteria."
        />
      </div>
    );
  }

  const { kpis, tier_breakdown, monthly_trends, recent_activities, attention_alerts } = data;

  const isDatasetCompletelyEmpty =
    kpis.channel_lead_flow.total_leads === 0 &&
    kpis.active_partners.value === 0 &&
    kpis.bookings_velocity.units_count === 0;

  if (isDatasetCompletelyEmpty) {
    return (
      <div className="py-8" data-testid="overview-empty-state">
        <EmptyState
          title="No Channel Activity Found"
          description="No leads, site visits, or bookings have been logged in the current dataset or filter window."
        />
      </div>
    );
  }

  return (
    <motion.div
      data-testid="overview-dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Live Operational Status Banner */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary mt-0.5 sm:mt-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Executive Intelligence Stream
                </h4>
                <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[10px] bg-emerald-50">
                  Real Database
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Consolidated partner network velocity, funnel conversion metrics, and operational audit trail.
              </p>
            </div>
          </div>

          <Badge variant="success" className="shrink-0 text-xs py-1 px-2.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active Pipeline
          </Badge>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Partners */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all shadow-sm" data-testid="kpi-card-active-partners">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Partners
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-value-active-partners">
                  {formatNumber(kpis.active_partners.value)}
                </span>
                {kpis.active_partners.growth_pct !== null && (
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{kpis.active_partners.growth_pct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {kpis.active_partners.breakdown.tier_1} Tier-1 / {kpis.active_partners.breakdown.tier_2} Tier-2 / {kpis.active_partners.breakdown.tier_3} Tier-3 active
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 2: Channel Lead Flow */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all shadow-sm" data-testid="kpi-card-lead-flow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channel Lead Flow
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-value-lead-flow">
                  {formatNumber(kpis.channel_lead_flow.valid_leads)}
                </span>
                {kpis.channel_lead_flow.growth_pct !== null && (
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{kpis.channel_lead_flow.growth_pct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatNumber(kpis.channel_lead_flow.qualified_leads)} qualified ({formatPercent(kpis.channel_lead_flow.qualification_rate_pct, 1)})
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 3: Visit Conversion */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all shadow-sm" data-testid="kpi-card-visit-conversion">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Visit Conversion
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-value-visit-conversion">
                  {formatPercent(kpis.site_visits.qualified_lead_to_visit_rate_pct, 1)}
                </span>
                {kpis.site_visits.growth_pct !== null && (
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{kpis.site_visits.growth_pct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatNumber(kpis.site_visits.total_completed)} of {formatNumber(kpis.site_visits.total_scheduled)} visits completed ({formatPercent(kpis.site_visits.visit_completion_rate_pct, 1)})
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 4: Bookings Velocity */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all shadow-sm" data-testid="kpi-card-bookings-velocity">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Bookings Velocity
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-value-bookings-velocity">
                  {formatNumber(kpis.bookings_velocity.confirmed_bookings)} Units
                </span>
                {kpis.bookings_velocity.growth_pct !== null && (
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{kpis.bookings_velocity.growth_pct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatPercent(kpis.bookings_velocity.visit_to_booking_rate_pct, 1)} visit close • {formatCurrencyInr(kpis.bookings_velocity.total_value_inr)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Pipeline Volume Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full shadow-sm" data-testid="chart-pipeline-velocity">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pipeline Velocity & Volume Trends</CardTitle>
                  <CardDescription>
                    Monthly progression of leads, completed property visits, and confirmed sales
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-50">
                  {monthly_trends.length} Months Logged
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full pt-2">
                {monthly_trends.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No monthly trend data available for the selected filter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly_trends}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
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
                      <Area
                        type="monotone"
                        dataKey="leads"
                        name="Leads"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#leadGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="site_visits"
                        name="Site Visits"
                        stroke="#0284c7"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#visitGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        name="Bookings"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#bookingGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Channel Tier Contribution Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-sm" data-testid="card-partner-tier-breakdown">
            <CardHeader>
              <CardTitle>Partner Tier Breakdown</CardTitle>
              <CardDescription>
                Registered channel partner segment share
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tier_breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="tier"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      width={95}
                      tick={{ fill: "#475569" }}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [
                        `${val ?? 0} partners`,
                        "Partners",
                      ]}
                    />
                    <Bar dataKey="partners_count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                {tier_breakdown.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1"
                    data-testid={`tier-row-${idx}`}
                  >
                    <span className="font-medium text-slate-700">{tier.tier}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground" data-testid={`tier-count-${idx}`}>
                        {tier.partners_count} partners
                      </span>
                      <Badge variant="secondary" className="text-[10px]" data-testid={`tier-pct-${idx}`}>
                        {tier.contribution}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Activity & Attention Center */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="shadow-sm flex flex-col" data-testid="card-recent-activity">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Channel Activity</CardTitle>
                <CardDescription>
                  Audit ledger capturing partner touchpoints and lifecycle events
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                View Log <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-4">
              {recent_activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No recent partner activities found.
                </div>
              ) : (
                <div
                  className="max-h-[270px] overflow-y-auto overflow-x-auto rounded-md border border-slate-100"
                  data-testid="recent-activity-viewport"
                >
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm border-b">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] text-xs font-semibold text-slate-700 bg-slate-50/95">Partner</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-700 bg-slate-50/95">Event</TableHead>
                        <TableHead className="w-[110px] text-xs font-semibold text-slate-700 bg-slate-50/95">Type</TableHead>
                        <TableHead className="text-right w-[90px] text-xs font-semibold text-slate-700 bg-slate-50/95">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent_activities.map((act) => (
                        <TableRow key={act.id} data-testid={`activity-row-${act.id}`} className="hover:bg-slate-50/60">
                          <TableCell className="font-semibold text-xs text-slate-900 break-words align-top">
                            {act.partner_name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 break-words align-top">
                            {act.action}
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge
                              variant={
                                act.status === "success"
                                  ? "success"
                                  : act.status === "info"
                                  ? "info"
                                  : "neutral"
                              }
                              className="text-[10px] py-0 px-1.5 whitespace-nowrap"
                            >
                              {act.tag}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap align-top">
                            {act.time_ago}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attention Center */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm" data-testid="card-attention-center">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <CardTitle>Attention Center</CardTitle>
              </div>
              <CardDescription>
                Deterministic operational alerts and project constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {attention_alerts.length === 0 ? (
                <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                  <h5 className="text-xs font-semibold text-slate-900">All Operations Nominal</h5>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    No critical bottlenecks or inventory warnings flagged for this period.
                  </p>
                </div>
              ) : (
                attention_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-md border border-amber-200 bg-amber-50/60 p-3"
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-amber-900">
                        {alert.title}
                      </h5>
                      <Badge
                        variant={alert.severity === "warning" ? "warning" : "neutral"}
                        className="text-[10px] py-0 capitalize"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-amber-800/90 mt-1">
                      {alert.description}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
