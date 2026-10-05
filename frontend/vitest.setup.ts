import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock Recharts ResponsiveContainer to render children directly in JSDOM
vi.mock("recharts", async () => {
  const originalModule = await vi.importActual<Record<string, any>>("recharts");
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        "div",
        { style: { width: 600, height: 300 } },
        children
      ),
  };
});
