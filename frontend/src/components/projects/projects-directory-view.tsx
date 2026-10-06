"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectListItem } from "@/lib/api/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { ProjectDetailView } from "./project-detail-view";
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/utils";

interface ProjectsDirectoryViewProps {
  initialProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  onSelectPartner?: (partnerId: string) => void;
}

export function ProjectsDirectoryView({
  initialProjectId,
  onSelectProject,
  onSelectPartner,
}: ProjectsDirectoryViewProps = {}) {
  // Navigation & Selected Project state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId || null
  );

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sync initialProjectId prop when changed
  useEffect(() => {
    if (initialProjectId !== undefined) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects({
    page,
    pageSize,
    family: familyFilter !== "all" ? familyFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    sortBy: sortBy !== "name" ? sortBy : undefined,
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFamilyFilter("all");
    setStatusFilter("all");
    setSortBy("name");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    familyFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "name";

  const handleProjectClick = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    } else {
      setSelectedProjectId(projectId);
    }
  };

  // If a project is currently selected, render the ProjectDetailView
  if (selectedProjectId) {
    return (
      <ProjectDetailView
        projectId={selectedProjectId}
        onBack={() => {
          setSelectedProjectId(null);
        }}
        onSelectPartner={onSelectPartner}
      />
    );
  }

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
      case "Nearly Sold Out":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
            Nearly Sold Out
          </Badge>
        );
      case "Upcoming":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
            Upcoming
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-semibold">
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-semibold">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6" data-testid="projects-portfolio-container">
      {/* View Header & Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              data-testid="projects-heading"
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              Project Portfolio
            </h1>
            <span
              data-testid="demo-environment-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
            >
              <Sparkles className="h-3 w-3 text-amber-600" />
              Demo Environment · Synthetic Data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Portfolio, inventory, funnel velocity, and channel contribution across
            Skyfinia and Infinia.
          </p>
        </div>
      </div>

      {/* Portfolio Summary Strip */}
      {data?.portfolio_summary && (
        <Card
          className="border-border bg-white shadow-2xs overflow-hidden"
          data-testid="portfolio-summary-strip"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border">
            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Projects
              </span>
              <span data-testid="summary-total-projects" className="text-xl font-bold text-slate-900 mt-1">
                {data.portfolio_summary.total_projects}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Residential Developments
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Project Families
              </span>
              <span data-testid="summary-total-families" className="text-xl font-bold text-slate-900 mt-1">
                {data.portfolio_summary.total_families}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Skyfinia & Infinia
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target Units
              </span>
              <span data-testid="summary-target-units" className="text-xl font-bold text-slate-900 mt-1">
                {formatNumber(data.portfolio_summary.total_target_units)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Planned Units
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available Units
              </span>
              <span data-testid="summary-available-units" className="text-xl font-bold text-slate-900 mt-1 text-blue-700">
                {formatNumber(data.portfolio_summary.total_available_units)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Unsold Inventory
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirmed Bookings
              </span>
              <span data-testid="summary-booked-units" className="text-xl font-bold text-emerald-700 mt-1">
                {formatNumber(data.portfolio_summary.total_booked_units)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Channel Closures
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Sales Value
              </span>
              <span data-testid="summary-booking-value" className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrencyInr(data.portfolio_summary.total_booking_value_inr)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Agreed Sales Volume
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Filter & Controls Bar */}
      <Card className="border-border bg-white p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="projects-search-input"
              placeholder="Search project name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Family Filter */}
            <select
              data-testid="projects-family-filter"
              value={familyFilter}
              onChange={(e) => {
                setFamilyFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Families</option>
              <option value="Skyfinia">Skyfinia</option>
              <option value="Infinia">Infinia</option>
            </select>

            {/* Status Filter */}
            <select
              data-testid="projects-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Nearly Sold Out">Nearly Sold Out</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Sort Dropdown */}
            <select
              data-testid="projects-sort-by"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="target_units">Sort: Target Units (High to Low)</option>
              <option value="available_units">Sort: Available Units (High to Low)</option>
              <option value="booked_units">Sort: Booked Units (High to Low)</option>
              <option value="booking_value">Sort: Sales Value (High to Low)</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 text-xs text-slate-500 hover:text-slate-900 gap-1.5"
                data-testid="clear-filters-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content View (Cards View) */}
      {isLoading ? (
        <LoadingState
          variant="skeleton"
          message="Loading project portfolio..."
          description="Fetching developer assets, inventory utilization, and channel velocity metrics."
        />
      ) : isError ? (
        <ErrorState
          title="Unable to load project portfolio"
          message={error?.message || "An unexpected error occurred while querying projects."}
          onRetry={() => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            hasActiveFilters
              ? "No projects match your active search or filter criteria. Try adjusting your filters."
              : "No development projects registered in the portfolio."
          }
          actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* Responsive Cards Grid */}
          <div
            data-testid="projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {data.items.map((project: ProjectListItem) => (
              <Card
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className="border-border bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Card Header: Badges & Identifiers */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {getFamilyBadge(project.project_family)}
                        {getStatusBadge(project.status)}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {project.project_code}
                      </span>
                    </div>

                    {/* Project Title & Micro-market */}
                    <div className="mt-2">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {project.name}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {project.location} · {project.city}
                        </span>
                      </div>
                    </div>

                    {/* Inventory & Pricing Floor Box */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-50/80 border border-border/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Starting Price Floor:</span>
                        <span className="font-bold text-slate-900">
                          From {formatCurrencyInr(project.starting_price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Target Units:</span>
                        <span className="font-semibold text-slate-800">
                          {project.target_units} Units
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Available Units:</span>
                        <span className="font-semibold text-blue-700">
                          {project.available_units} Units
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Booked Inventory:</span>
                        <span className="font-semibold text-emerald-700">
                          {project.metrics.booked_units} Units (
                          {formatPercent(project.metrics.inventory_utilization_pct)})
                        </span>
                      </div>
                    </div>

                    {/* Channel Funnel Chips Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          Leads
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {project.metrics.total_leads}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          Visits
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {project.metrics.completed_visits}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-emerald-50/60 border border-emerald-100">
                        <span className="block text-[10px] text-emerald-700 uppercase font-semibold">
                          Bookings
                        </span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {project.metrics.confirmed_bookings}
                        </span>
                      </div>
                    </div>

                    {/* Sales Volume & Conversion */}
                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Sales Volume</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrencyInr(project.metrics.gross_booking_value_inr)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Lead → Booking</span>
                        <span className="font-bold text-blue-700">
                          {formatPercent(project.metrics.overall_conversion_rate_pct)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProjectClick(project.id)}
                      data-testid={`view-project-${project.id}-btn`}
                      className="w-full text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50/60 border-blue-200 justify-between group-hover:border-blue-300"
                    >
                      <span>View Project →</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="text-xs text-slate-500">
                Showing page <span className="font-semibold">{data.pagination.page}</span> of{" "}
                <span className="font-semibold">{data.pagination.total_pages}</span> (
                {data.pagination.total} total projects)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 text-xs"
                  data-testid="pagination-prev-btn"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 gap-1 text-xs"
                  data-testid="pagination-next-btn"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
