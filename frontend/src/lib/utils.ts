import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Indian currency amounts into standard shorthand (e.g. ₹438.5 Cr, ₹85 L)
 */
export function formatCurrencyInr(amount: number): string {
  if (!amount || amount === 0) return "₹0";
  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    return `₹${cr >= 100 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    const l = amount / 100_000;
    return `₹${l.toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format integer or decimal numbers with Indian locale grouping
 */
export function formatNumber(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return val.toLocaleString("en-IN");
}

/**
 * Format percentages with consistent decimal precision
 */
export function formatPercent(val: number, precision: number = 1): string {
  if (val === undefined || val === null || isNaN(val)) return "0.0%";
  return `${val.toFixed(precision)}%`;
}
