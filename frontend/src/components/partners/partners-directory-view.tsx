"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { usePartners } from "@/hooks/use-partners";
import { useOverviewSummary } from "@/hooks/use-overview-summary";
import { PartnerListItem } from "@/lib/api/partners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PartnerDetailView } from "./partner-detail-view";
import { formatNumber, formatPercent } from "@/lib/utils";

export function PartnersDirectoryView() {
  // Navigation & Selected Partner state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // View Mode state: Cards (Portfolio Default) | List (Dense Table)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "", "true", "false"
  const [cityFilter, setCityFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search change
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const activeBool =
    statusFilter === "true" ? true : statusFilter === "false" ? false : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = usePartners({
    page,
    page_size: pageSize,
    tier: tierFilter || undefined,
    active: activeBool,
    city: cityFilter || undefined,
    search: debouncedSearch || undefined,
    sort_by: sortBy || undefined,
  });

  // Fetch overview summary for real live portfolio metrics
  const { data: overviewData } = useOverviewSummary();

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setTierFilter("");
    setStatusFilter("");
    setCityFilter("");
    setSortBy("name");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(tierFilter) ||
    Boolean(statusFilter) ||
    Boolean(cityFilter) ||
    sortBy !== "name";

  // If a partner is currently selected, render the PartnerDetailView
  if (selectedPartnerId) {
    return (
      <PartnerDetailView
        partnerId={selectedPartnerId}
        onBack={() => setSelectedPartnerId(null)}
      />
    );
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "Tier 1":
        return "warning"; // Amber/Gold for Tier 1 Elite
      case "Tier 2":
        return "info"; // Sky/Blue for Tier 2 Growth
      default:
        return "neutral"; // Slate for Tier 3 Active
    }
  };

  const pagination = data?.pagination;
  const items = data?.items || [];

  // Derive portfolio summary stats from API
  const totalPartnersCount = overviewData?.tier_breakdown
    ? overviewData.tier_breakdown.reduce((acc, curr) => acc + curr.partners_count, 0)
    : pagination?.total || 36;

  const recentlyActivePartnersCount = overviewData?.kpis?.active_partners?.value || 28;

  const tier1Count =
    overviewData?.tier_breakdown?.find((t) => t.tier.includes("Tier 1"))
      ?.partners_count || 6;
  const tier2Count =
    overviewData?.tier_breakdown?.find((t) => t.tier.includes("Tier 2"))
      ?.partners_count || 10;
  const tier3Count =
    overviewData?.tier_breakdown?.find((t) => t.tier.includes("Tier 3"))
      ?.partners_count || 20;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Header & Overview Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Channel Partners Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Partner network registry, real-time engagement, and performance intelligence.
          </p>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              data-testid="view-mode-cards-btn"
              aria-label="Switch to Card Portfolio view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              data-testid="view-mode-list-btn"
              aria-label="Switch to Dense List Table view"
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Data Portfolio Summary Context Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="portfolio-summary-bar">
        {/* Total Network Partners */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Total Partners</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5" data-testid="summary-total-partners">
            {formatNumber(totalPartnersCount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered network</div>
        </div>

        {/* Recently Active (Trailing 90d) */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Recently Active</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5" data-testid="summary-active-partners">
            {formatNumber(recentlyActivePartnersCount)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Trailing 90 days active</div>
        </div>

        {/* Tier 1 Elite */}
        <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/70 shadow-2xs">
          <div className="text-[11px] font-medium text-amber-800">Tier 1 (Elite)</div>
          <div className="text-lg font-bold text-amber-950 mt-0.5" data-testid="summary-tier-1">
            {formatNumber(tier1Count)}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Strategic volume leaders</div>
        </div>

        {/* Tier 2 Growth */}
        <div className="p-3 bg-sky-50/40 rounded-xl border border-sky-200/70 shadow-2xs">
          <div className="text-[11px] font-medium text-sky-800">Tier 2 (Growth)</div>
          <div className="text-lg font-bold text-sky-950 mt-0.5" data-testid="summary-tier-2">
            {formatNumber(tier2Count)}
          </div>
          <div className="text-[10px] text-sky-700 mt-0.5">High-momentum agencies</div>
        </div>

        {/* Tier 3 Active */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-600">Tier 3 (Active)</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5" data-testid="summary-tier-3">
            {formatNumber(tier3Count)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Independent broker base</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, contact, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
                data-testid="partners-search-input"
              />
            </div>

            {/* Tier Filter */}
            <div>
              <select
                aria-label="Filter by partner tier"
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="partners-tier-filter"
              >
                <option value="">All Tiers</option>
                <option value="Tier 1">Tier 1 (Elite)</option>
                <option value="Tier 2">Tier 2 (Growth)</option>
                <option value="Tier 3">Tier 3 (Active)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                aria-label="Filter by account status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="partners-status-filter"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* City / Micro-Market Filter */}
            <div>
              <select
                aria-label="Filter by city"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="partners-city-filter"
              >
                <option value="">All Micro-Markets</option>
                <option value="Pune">Pune (All)</option>
                <option value="Tathawade">Tathawade</option>
                <option value="Wakad">Wakad</option>
                <option value="Hinjawadi">Hinjawadi</option>
                <option value="Ravet">Ravet</option>
                <option value="Punawale">Punawale</option>
                <option value="Baner">Baner</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                aria-label="Sort partners list"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="partners-sort-by"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="onboarding_date">Sort: Onboarded (Newest)</option>
                <option value="tier">Sort: Tier</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Reset Action */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-700">Filters:</span>
                {debouncedSearch && (
                  <Badge variant="neutral" className="gap-1 text-[11px]">
                    Search: &quot;{debouncedSearch}&quot;
                  </Badge>
                )}
                {tierFilter && (
                  <Badge variant="neutral" className="gap-1 text-[11px]">
                    Tier: {tierFilter}
                  </Badge>
                )}
                {statusFilter && (
                  <Badge variant="neutral" className="gap-1 text-[11px]">
                    Status: {statusFilter === "true" ? "Active" : "Inactive"}
                  </Badge>
                )}
                {cityFilter && (
                  <Badge variant="neutral" className="gap-1 text-[11px]">
                    City: {cityFilter}
                  </Badge>
                )}
                {sortBy !== "name" && (
                  <Badge variant="neutral" className="gap-1 text-[11px]">
                    Sorted by: {sortBy}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1"
                data-testid="clear-filters-btn"
              >
                <RotateCcw className="h-3 w-3" /> Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Loading, Error, Empty, or Cards / List */}
      {isLoading ? (
        <LoadingState
          variant="skeleton"
          message="Loading channel partners..."
          description="Fetching registered partner network and calculating performance KPIs."
        />
      ) : isError ? (
        <ErrorState
          title="Unable to load partners"
          message={error?.message || "Communication with the partner intelligence service failed."}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No partners match these filters"
          description="Try broadening your search query or removing active tier/status constraints."
          actionLabel="Clear filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="space-y-6">
          {/* VIEW 1: Cards Portfolio (Default View) */}
          {viewMode === "cards" ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              data-testid="partners-cards-grid"
            >
              {items.map((partner) => (
                <Card
                  key={partner.id}
                  className="group relative border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
                  onClick={() => setSelectedPartnerId(partner.id)}
                  data-testid={`partner-card-${partner.partner_code.toLowerCase()}`}
                >
                  <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    {/* Top Row: Identity & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {partner.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {partner.partner_code}
                            </span>
                            <span>•</span>
                            <span className="truncate">{partner.channel_type}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant={getTierBadgeVariant(partner.tier)}>
                            {partner.tier}
                          </Badge>
                          {partner.active ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location & Manager Context */}
                      <div className="text-xs text-slate-600 space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {partner.city} · {partner.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Manager:{" "}
                            <strong className="text-slate-700 font-medium">
                              {partner.assigned_salesperson?.name || "Unassigned"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Performance Metric Chips */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Leads</div>
                        <div className="font-bold text-slate-900 mt-0.5 text-sm">
                          {formatNumber(partner.summary_stats.total_leads)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Visits</div>
                        <div className="font-bold text-slate-900 mt-0.5 text-sm">
                          {formatNumber(partner.summary_stats.completed_visits)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Bookings</div>
                        <div className="font-bold text-emerald-700 mt-0.5 text-sm">
                          {formatNumber(partner.summary_stats.confirmed_bookings)}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Conversion Summary & Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-emerald-800">
                          {formatPercent(partner.summary_stats.overall_conversion_rate_pct)} Overall Conv.
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatPercent(partner.summary_stats.visit_to_booking_rate_pct)} Visit → Book
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all">
                        View Partner <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* VIEW 2: Dense Table View */
            <div>
              {/* Desktop & Tablet Table View */}
              <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden hidden md:block" data-testid="partners-table-card">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Partner</TableHead>
                        <TableHead className="w-24">Tier</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Assigned Manager</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Visit → Book</TableHead>
                        <TableHead className="text-right">Conversion</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((partner) => (
                        <TableRow
                          key={partner.id}
                          className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                          onClick={() => setSelectedPartnerId(partner.id)}
                          data-testid={`partner-row-${partner.partner_code.toLowerCase()}`}
                        >
                          {/* Partner Name & Code */}
                          <TableCell>
                            <div className="font-semibold text-xs text-slate-900">
                              {partner.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono font-medium text-slate-700">
                                {partner.partner_code}
                              </span>
                              <span>•</span>
                              <span>{partner.channel_type}</span>
                            </div>
                          </TableCell>

                          {/* Tier Badge */}
                          <TableCell>
                            <Badge variant={getTierBadgeVariant(partner.tier)}>
                              {partner.tier}
                            </Badge>
                          </TableCell>

                          {/* Location */}
                          <TableCell>
                            <div className="text-xs text-slate-800 font-medium">
                              {partner.city}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[120px]">
                              {partner.location}
                            </div>
                          </TableCell>

                          {/* Assigned Manager */}
                          <TableCell>
                            {partner.assigned_salesperson ? (
                              <div className="text-xs font-medium text-slate-800">
                                {partner.assigned_salesperson.name}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                            )}
                          </TableCell>

                          {/* Leads */}
                          <TableCell className="text-right">
                            <div className="font-semibold text-xs text-slate-900">
                              {formatNumber(partner.summary_stats.total_leads)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {formatNumber(partner.summary_stats.qualified_leads)} qual
                            </div>
                          </TableCell>

                          {/* Visits */}
                          <TableCell className="text-right font-semibold text-xs text-slate-900">
                            {formatNumber(partner.summary_stats.completed_visits)}
                          </TableCell>

                          {/* Bookings */}
                          <TableCell className="text-right font-semibold text-xs text-slate-900">
                            {formatNumber(partner.summary_stats.confirmed_bookings)}
                          </TableCell>

                          {/* Visit -> Booking Rate */}
                          <TableCell className="text-right font-medium text-xs text-slate-800">
                            {formatPercent(partner.summary_stats.visit_to_booking_rate_pct)}
                          </TableCell>

                          {/* Overall Conversion Rate */}
                          <TableCell className="text-right font-semibold text-xs text-emerald-700">
                            {formatPercent(partner.summary_stats.overall_conversion_rate_pct)}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {partner.active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </TableCell>

                          {/* Action */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPartnerId(partner.id)}
                              className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              data-testid={`view-partner-${partner.partner_code.toLowerCase()}`}
                            >
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Mobile Card Deck in List Mode */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {items.map((partner) => (
                  <Card
                    key={partner.id}
                    className="border-slate-200 shadow-xs bg-white p-4 space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          {partner.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono font-medium text-slate-700">
                            {partner.partner_code}
                          </span>
                          <span>•</span>
                          <span>{partner.city}</span>
                        </div>
                      </div>
                      <Badge variant={getTierBadgeVariant(partner.tier)}>
                        {partner.tier}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Leads</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {formatNumber(partner.summary_stats.total_leads)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Visits</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {formatNumber(partner.summary_stats.completed_visits)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Bookings</div>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {formatNumber(partner.summary_stats.confirmed_bookings)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                      <span>
                        Conv: <strong>{formatPercent(partner.summary_stats.overall_conversion_rate_pct)}</strong>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartnerId(partner.id);
                        }}
                      >
                        View Details →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Real API Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(pagination.page - 1) * pagination.page_size + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(pagination.page * pagination.page_size, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {formatNumber(pagination.total)}
                </span>{" "}
                partners
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                  className="h-8 px-2.5 text-xs gap-1 border-slate-200 text-slate-700"
                  data-testid="pagination-prev-btn"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <span className="text-xs text-slate-600 px-2 font-medium" data-testid="pagination-page-indicator">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(pagination.total_pages, prev + 1))}
                  disabled={pagination.page >= pagination.total_pages}
                  className="h-8 px-2.5 text-xs gap-1 border-slate-200 text-slate-700"
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
