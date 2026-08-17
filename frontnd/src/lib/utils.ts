import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pinned to a fixed locale (rather than the runtime default) so number
// formatting is identical between server-rendered HTML and client hydration
// - the server and browser can otherwise resolve different default locales,
// which produces a React hydration mismatch on any value over 999.
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
