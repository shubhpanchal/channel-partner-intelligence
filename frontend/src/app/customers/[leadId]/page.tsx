"use client";

import React, { useState } from "react";
import { Sidebar, NavItemKey } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import { useRouter } from "next/navigation";

interface CustomerPageProps {
  params: {
    leadId: string;
  };
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const leadId = params.leadId;

  return (
    <div className="flex h-screen bg-slate-50/60 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeKey="leads"
        onSelect={(key) => {
          if (key === "overview") {
            router.push("/");
          } else {
            router.push(`/?section=${key}`);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          title="Customer Profile & Lifecycle"
          subtitle="Detailed lead attribution, site visit logs, and booking replacement chronology"
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <CustomerDetailView leadId={leadId} />
          </div>
        </main>
      </div>
    </div>
  );
}
