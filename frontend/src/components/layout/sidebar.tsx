"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  FileCheck,
  Building2,
  Zap,
  BarChart3,
  Settings,
  X,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NavItemKey =
  | "overview"
  | "partners"
  | "leads"
  | "site-visits"
  | "bookings"
  | "projects"
  | "action-center"
  | "reports"
  | "settings";

export interface NavItem {
  key: NavItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "partners", label: "Partners", icon: Users, badge: "Phase 2" },
  { key: "leads", label: "Leads", icon: UserCheck, badge: "Phase 2" },
  { key: "site-visits", label: "Site Visits", icon: CalendarCheck, badge: "Phase 2" },
  { key: "bookings", label: "Bookings", icon: FileCheck, badge: "Phase 2" },
  { key: "projects", label: "Projects", icon: Building2, badge: "Phase 2" },
  { key: "action-center", label: "Action Center", icon: Zap, badge: "Phase 3" },
  { key: "reports", label: "Reports", icon: BarChart3, badge: "Phase 3" },
  { key: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeKey: NavItemKey;
  onSelect: (key: NavItemKey) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeKey, onSelect, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          data-testid="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        data-testid="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:h-screen lg:shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
                Channel Partner
              </h1>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Intelligence
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* System Phase Status Indicator */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Demo Environment</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold bg-blue-50 text-blue-700 border-blue-200">
              Harivishva Demo
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tathawade Portfolio · Synthetic Data</p>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <nav className="space-y-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelect(item.key);
                    if (onClose) onClose();
                  }}
                  data-testid={`nav-item-${item.key}`}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-border p-3.5 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-foreground">
                Executive Admin
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Hariwishwa Channel Ops
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
