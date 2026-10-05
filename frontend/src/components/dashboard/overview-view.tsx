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
  Layers,
  ChevronRight,
  Info,
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

// Sample chart data illustrating design system styling (explicitly labeled as UI blueprint)
const SAMPLE_VELOCITY_DATA = [
  { month: "Jan", leads: 420, visits: 180, bookings: 42 },
  { month: "Feb", leads: 510, visits: 220, bookings: 54 },
  { month: "Mar", leads: 640, visits: 310, bookings: 78 },
  { month: "Apr", leads: 590, visits: 280, bookings: 65 },
  { month: "May", leads: 780, visits: 390, bookings: 92 },
  { month: "Jun", leads: 920, visits: 460, bookings: 115 },
];

const SAMPLE_PARTNER_TIERS = [
  { tier: "Tier 1 (Elite)", partners: 18, contribution: "52%" },
  { tier: "Tier 2 (Growth)", partners: 45, contribution: "34%" },
  { tier: "Tier 3 (Active)", partners: 112, contribution: "14%" },
];

const SAMPLE_RECENT_ACTIVITIES = [
  {
    id: "act-1",
    partner: "Apex Realty Partners",
    action: "Submitted 6 new qualified leads for Project Solaris",
    time: "12m ago",
    status: "success",
    tag: "Lead Batch",
  },
  {
    id: "act-2",
    partner: "Horizon Channel Network",
    action: "Site visit logged with customer token verification",
    time: "45m ago",
    status: "info",
    tag: "Site Visit",
  },
  {
    id: "act-3",
    partner: "Metro Prime Brokers",
    action: "Unit 402 booking confirmed & registration pending",
    time: "2h ago",
    status: "success",
    tag: "Booking",
  },
  {
    id: "act-4",
    partner: "Summit Property Advisors",
    action: "Quarterly re-qualification milestone reached",
    time: "4h ago",
    status: "neutral",
    tag: "Tier Update",
  },
];

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

export function OverviewView() {
  return (
    <motion.div
      data-testid="overview-dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Phase 1 Verification / Design System Notice Banner */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-start space-x-3">
            <div className="rounded-md bg-blue-600/10 p-1.5 text-blue-700 mt-0.5 sm:mt-0">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Phase 1 Foundation Checkpoint
                </h4>
                <Badge variant="outline" className="border-blue-300 text-blue-800 text-[10px] bg-white">
                  Sample UI Layout
                </Badge>
              </div>
              <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">
                This dashboard establishes the light enterprise visual system, typography, tokens,
                and layout. Metrics and charts below represent sample structural placeholders for
                manual UI validation.
              </p>
            </div>
          </div>

          <Badge variant="success" className="shrink-0 text-xs py-1 px-2.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Quality Gate Active
          </Badge>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all">
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
                <span className="text-2xl font-bold text-foreground">175</span>
                <span className="flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +12.4%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sample: 18 Tier-1 / 45 Tier-2 / 112 Tier-3
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 2 */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all">
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
                <span className="text-2xl font-bold text-foreground">3,860</span>
                <span className="flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +18.2%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sample: Monthly qualified channel leads
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 3 */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all">
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
                <span className="text-2xl font-bold text-foreground">48.5%</span>
                <span className="flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +4.1%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sample: Lead to verified site visit ratio
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI 4 */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-primary/40 transition-all">
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
                <span className="text-2xl font-bold text-foreground">446 Units</span>
                <span className="flex items-center text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +23.0%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sample: Year-to-date channel partner volume
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Pipeline Volume Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pipeline Velocity & Volume Trends</CardTitle>
                  <CardDescription>
                    Visual layout demonstration of multi-tier channel progression
                  </CardDescription>
                </div>
                <Badge variant="neutral" className="text-[10px]">
                  Sample Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SAMPLE_VELOCITY_DATA}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
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
                      dataKey="visits"
                      name="Site Visits"
                      stroke="#0284c7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#visitGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Channel Tier Contribution Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Partner Tier Breakdown</CardTitle>
              <CardDescription>
                Channel segment share & distribution layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SAMPLE_PARTNER_TIERS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="tier"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      width={90}
                      tick={{ fill: "#475569" }}
                    />
                    <RechartsTooltip />
                    <Bar dataKey="partners" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                {SAMPLE_PARTNER_TIERS.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="font-medium text-slate-700">{tier.tier}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{tier.partners} partners</span>
                      <Badge variant="secondary" className="text-[10px]">
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

      {/* Bottom Row: Recent Activity & Attention / Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity Table Placeholder */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Channel Activity</CardTitle>
                <CardDescription>
                  Mock audit trail illustrating real-time partner event streams
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                View Log <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Partner</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="text-right w-[90px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_RECENT_ACTIVITIES.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {act.partner}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {act.action}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            act.status === "success"
                              ? "success"
                              : act.status === "info"
                              ? "info"
                              : "neutral"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {act.tag}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {act.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attention & Action Recommendations Placeholder */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <CardTitle>Attention Center</CardTitle>
              </div>
              <CardDescription>
                Sample architectural placeholder for Phase 3 algorithmic triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-amber-900">
                    Lead Re-engagement Needed
                  </h5>
                  <Badge variant="warning" className="text-[10px] py-0">
                    Sample
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-1">
                  14 leads assigned to Tier-2 partners have not received follow-up within 48h.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-slate-900">
                    Quarterly Review Pending
                  </h5>
                  <Badge variant="neutral" className="text-[10px] py-0">
                    Sample
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  8 brokerages eligible for Tier-1 promotion review in current cycle.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full text-xs font-medium border-dashed text-slate-600 hover:text-slate-900 mt-2"
                disabled
              >
                Action Engine (Available Phase 3)
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
