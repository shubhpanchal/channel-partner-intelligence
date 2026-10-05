"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ArrowLeft,
  Sparkles,
  Layers,
  Database,
  BarChart2,
  Workflow,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { NavItemKey } from "@/components/layout/sidebar";

interface PlaceholderViewProps {
  sectionKey: NavItemKey;
  title: string;
  onBackToOverview: () => void;
}

const SECTION_DETAILS: Record<
  NavItemKey,
  {
    phase: string;
    plannedScope: string[];
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  overview: {
    phase: "Phase 1",
    plannedScope: ["Executive KPI summary", "Pipeline velocity", "Channel overview"],
    description: "Core intelligence dashboard.",
    icon: BarChart2,
  },
  partners: {
    phase: "Phase 2",
    plannedScope: [
      "Partner registry & classification (Tier 1/2/3)",
      "Channel partner scoring & activity tracking",
      "Historical engagement analytics",
      "Active broker directory",
    ],
    description: "Full partner directory, tiers, engagement history, and performance scoring.",
    icon: Database,
  },
  leads: {
    phase: "Phase 2",
    plannedScope: [
      "Lead source attribution to channel partners",
      "Lead status pipeline (Fresh, Contacted, Qualified, Site Visit Scheduled)",
      "Channel lead velocity and conversion lag metrics",
    ],
    description: "Real-time channel lead flow and partner attribution tracking.",
    icon: Layers,
  },
  "site-visits": {
    phase: "Phase 2",
    plannedScope: [
      "Site visit scheduling & verification",
      "Lead-to-visit conversion ratio per partner",
      "Visit outcome analytics (Positive, Revisit, Cold)",
    ],
    description: "Physical and virtual site visit monitoring and verification logs.",
    icon: Workflow,
  },
  bookings: {
    phase: "Phase 2",
    plannedScope: [
      "Confirmed unit bookings & token payments",
      "Partner commission & payout status",
      "Revenue contribution per broker",
    ],
    description: "Transactional booking velocity and revenue analytics.",
    icon: BarChart2,
  },
  projects: {
    phase: "Phase 2",
    plannedScope: [
      "Project inventory & unit availability",
      "Partner project allocation & performance per location",
      "Pricing tiers and project brochures",
    ],
    description: "Development projects portfolio and channel allocation.",
    icon: Layers,
  },
  "action-center": {
    phase: "Phase 3",
    plannedScope: [
      "AI-driven automated partner recommendations",
      "At-risk partner churn alerts",
      "Targeted channel campaigns & engagement actions",
    ],
    description: "Intelligent actions and algorithmic recommendations for channel managers.",
    icon: Sparkles,
  },
  reports: {
    phase: "Phase 3",
    plannedScope: [
      "Custom executive reports builder",
      "CSV/PDF export engine",
      "Scheduled intelligence digests",
    ],
    description: "Deep-dive analytical reporting and export suite.",
    icon: BarChart2,
  },
  settings: {
    phase: "Phase 1 / Config",
    plannedScope: [
      "API connection endpoints",
      "Database schema synchronization status",
      "System audit & authentication rules",
    ],
    description: "System configuration, environment settings, and data feeds.",
    icon: ShieldAlert,
  },
};

export function PlaceholderView({
  sectionKey,
  title,
  onBackToOverview,
}: PlaceholderViewProps) {
  const info = SECTION_DETAILS[sectionKey] || {
    phase: "Future Phase",
    plannedScope: ["Feature specification in progress"],
    description: "This module is slated for future phases.",
    icon: Layers,
  };

  const Icon = info.icon;

  return (
    <motion.div
      data-testid="placeholder-view-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Banner / Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToOverview}
            className="h-8 gap-1 text-xs"
            data-testid="back-to-overview-button"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Overview
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </div>

        <Badge variant="neutral" className="w-fit text-xs gap-1 py-1">
          <Clock className="h-3 w-3" />
          Scheduled for {info.phase}
        </Badge>
      </div>

      {/* Main Roadmap & UI State Playground Tabs */}
      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="roadmap">Scope Blueprint</TabsTrigger>
          <TabsTrigger value="empty-state">Empty State</TabsTrigger>
          <TabsTrigger value="loading-state">Loading State</TabsTrigger>
          <TabsTrigger value="error-state">Error State</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>{title} Module Architecture</CardTitle>
                  <CardDescription>
                    Quality gates and functional requirements defined for {info.phase}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Planned Business Functionality
                </h4>
                <ul className="space-y-2">
                  {info.plannedScope.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-xs text-slate-700 space-x-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-md border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800">
                <p className="font-semibold mb-1">Phase 1 Architecture Policy:</p>
                <p className="text-blue-700">
                  Actual business calculations, synthetic datasets, and API endpoints for this
                  module are deferred until Phase 2 to ensure rigorous adherence to development quality gates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empty-state" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Empty State Pattern</CardTitle>
              <CardDescription>
                Verified UX pattern used across the platform when no records are returned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title={`No ${title} Records Found`}
                description={`No active data records currently match the selected criteria for ${title.toLowerCase()}. You can initiate an import or adjust your filters.`}
                actionLabel={`Create First ${title.slice(0, -1) || title}`}
                onAction={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loading-state" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Loading State Patterns</CardTitle>
              <CardDescription>
                Spinner and skeleton patterns used during asynchronous data fetching.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Spinner Pattern
                </p>
                <LoadingState
                  message={`Synchronizing ${title} records...`}
                  description="Retrieving dataset from SQLite and analytical indices."
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Skeleton Pattern
                </p>
                <LoadingState variant="skeleton" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error-state" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Error & Recovery State Pattern</CardTitle>
              <CardDescription>
                Resilient error handling with retry trigger for failed API operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorState
                title={`Unable to fetch ${title}`}
                message="The upstream service returned a transient network timeout. Please verify backend service health."
                onRetry={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
