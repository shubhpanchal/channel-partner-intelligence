"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { usePartners } from "@/hooks/use-partners";
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
        return "warning";
      case "Tier 2":
        return "info";
      default:
        return "neutral";
    }
  };

  const pagination = data?.pagination;
  const items = data?.items || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Header & Overview Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Channel Partners Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Partner network registry, engagement metrics, and historical performance from canonical dataset.
          </p>
        </div>
        {pagination && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-white shadow-xs">
              Total Partners: {formatNumber(pagination.total)}
            </Badge>
          </div>
        )}
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

            {/* City Filter */}
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
                <option value="">All Cities</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad</option>
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

      {/* Main Content: Loading, Error, Empty, or Table */}
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
        <div className="space-y-4">
          {/* Desktop & Tablet Table View */}
          <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden hidden md:block">
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

          {/* Mobile Card Deck View */}
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

          {/* Pagination Controls */}
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
