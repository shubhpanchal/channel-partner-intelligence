"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, User, Building, Phone, ArrowRight, X } from "lucide-react";
import { useCustomerSearch } from "@/hooks/use-customers";
import { CustomerSearchItem } from "@/lib/api/customers";
import { Badge } from "@/components/ui/badge";

export function CustomerSearch() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const { data, isLoading, isError } = useCustomerSearch(
    debouncedQuery,
    8,
    { enabled: debouncedQuery.length >= 2 }
  );

  // Open dropdown when query has >= 2 chars
  useEffect(() => {
    if (inputValue.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [inputValue]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerSearchItem) => {
    setIsOpen(false);
    setInputValue("");
    router.push(`/customers/${customer.lead_id}`);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Converted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Qualified":
      case "Site Visit Scheduled":
      case "Site Visit Completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Booking Initiated":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Lost":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Invalid":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div ref={containerRef} className="relative w-40 sm:w-60 md:w-72 lg:w-80">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          data-testid="global-customer-search-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (inputValue.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search customer, lead, phone..."
          aria-label="Search customer, lead, phone"
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-foreground placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              setIsOpen(false);
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Results Dropdown Popover */}
      {isOpen && inputValue.trim().length >= 2 && (
        <div
          data-testid="global-customer-search-dropdown"
          className="absolute right-0 top-full mt-1.5 z-50 w-[calc(100vw-2.5rem)] sm:w-[420px] max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 duration-100"
        >
          {isLoading ? (
            <div
              data-testid="search-loading-indicator"
              className="flex items-center justify-center space-x-2 py-6 text-xs text-slate-500"
            >
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Searching customer leads...</span>
            </div>
          ) : isError ? (
            <div
              data-testid="search-error-message"
              className="py-4 text-center text-xs font-medium text-rose-600"
            >
              Unable to search customers. Please try again.
            </div>
          ) : data && data.items.length === 0 ? (
            <div
              data-testid="search-empty-message"
              className="py-6 text-center text-xs text-slate-500"
            >
              <p className="font-medium text-slate-700">No customers found</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                No leads matched &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Matching Leads ({data.total})
              </div>
              {data.items.map((item) => (
                <button
                  key={item.lead_id}
                  data-testid={`search-result-item-${item.lead_id}`}
                  onClick={() => handleSelectCustomer(item)}
                  className="w-full flex items-center justify-between rounded-md p-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-hidden transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600">
                        {item.customer_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {item.lead_code}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getStatusVariant(
                          item.lead_status
                        )}`}
                      >
                        {item.lead_status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500 truncate">
                      <span className="flex items-center space-x-1">
                        <Building className="h-3 w-3 text-slate-400" />
                        <span>{item.project_name}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{item.channel_partner_name}</span>
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
