"use client";

import React from "react";
import {
  Menu,
  Bell,
  Search,
  ShieldCheck,
  User,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
}

export function Header({ title, subtitle, onOpenSidebar }: HeaderProps) {
  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur-md sm:px-6"
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
          data-testid="sidebar-toggle-button"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Placeholder */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search partners, leads, projects..."
            className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            readOnly
          />
        </div>

        {/* Subtle Persistent Demo Environment Indicator */}
        <div
          data-testid="demo-environment-indicator"
          className="hidden lg:flex items-center space-x-1.5 rounded-full bg-slate-100/90 border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Demo Environment · Synthetic Data</span>
        </div>

        {/* Backend Connectivity Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                data-testid="backend-status-indicator"
                className="flex items-center space-x-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Backend Healthy</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>FastAPI Backend v0.1.0 Service Online</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications Placeholder */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
                aria-label="Notifications"
                data-testid="notification-button"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>3 system notifications (Phase 1 preview)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Profile Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 rounded-full p-1 hover:bg-slate-100"
              data-testid="user-profile-trigger"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                AD
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-xs font-semibold text-foreground">Admin User</p>
              <p className="text-[11px] font-normal text-muted-foreground">
                admin@harivishva.com
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              System Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Security & Audit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-rose-600 focus:text-rose-600">
              Sign Out (Demo)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
