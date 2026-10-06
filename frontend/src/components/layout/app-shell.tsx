"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar, NavItemKey, NAV_ITEMS } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OverviewView } from "@/components/dashboard/overview-view";
import { PartnersDirectoryView } from "@/components/partners/partners-directory-view";
import { PlaceholderView } from "@/components/dashboard/placeholder-view";

const SECTION_TITLES: Record<NavItemKey, { title: string; subtitle: string }> = {
  overview: {
    title: "Executive Overview",
    subtitle: "Real-time channel partner health, velocity indicators, and network activity",
  },
  partners: {
    title: "Channel Partners Directory",
    subtitle: "Partner network registry, tiers, performance ratings, and broker profiles",
  },
  leads: {
    title: "Channel Leads Pipeline",
    subtitle: "Inbound partner lead attribution, status stages, and qualification metrics",
  },
  "site-visits": {
    title: "Site Visits & Verification",
    subtitle: "Scheduled property visits, verification token logs, and partner conversion",
  },
  bookings: {
    title: "Bookings & Transaction Velocity",
    subtitle: "Confirmed unit closures, revenue contribution, and partner payout tracking",
  },
  projects: {
    title: "Projects & Inventory Allocation",
    subtitle: "Active project portfolio, unit availability, and partner marketing assets",
  },
  "action-center": {
    title: "Intelligence Action Center",
    subtitle: "Algorithmic partner interventions, churn alerts, and engagement workflows",
  },
  reports: {
    title: "Reports & Analytics Studio",
    subtitle: "Deep-dive analytical builders, custom segment exports, and intelligence digests",
  },
  settings: {
    title: "System Configuration & Integration",
    subtitle: "Database connection parameters, API keys, and environment diagnostics",
  },
};

function AppShellInner() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams?.get("section") as NavItemKey | null;
  const partnerIdParam = searchParams?.get("partnerId");

  const [activeKey, setActiveKey] = useState<NavItemKey>(() => {
    if (sectionParam && SECTION_TITLES[sectionParam]) {
      return sectionParam;
    }
    return "overview";
  });


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (sectionParam && SECTION_TITLES[sectionParam]) {
      setActiveKey(sectionParam);
    }
  }, [sectionParam]);

  const currentSection = SECTION_TITLES[activeKey] || SECTION_TITLES.overview;

  return (
    <div className="flex h-screen bg-slate-50/60 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeKey={activeKey}
        onSelect={(key) => setActiveKey(key)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          title={currentSection.title}
          subtitle={currentSection.subtitle}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeKey === "overview" ? (
              <OverviewView />
            ) : activeKey === "partners" ? (
              <PartnersDirectoryView initialPartnerId={partnerIdParam} />
            ) : (
              <PlaceholderView
                sectionKey={activeKey}
                title={currentSection.title}
                onBackToOverview={() => setActiveKey("overview")}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/60" />}>
      <AppShellInner />
    </Suspense>
  );
}

