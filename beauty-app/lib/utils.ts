import { TZDate } from "@date-fns/tz";
import { clsx, type ClassValue } from "clsx";
import { format, isSameDay, addDays } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const slugify = (name: string) => {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const formatBookingShortDate = (
  timestamp: number,
  timezone?: string,
) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "MMM d, p");
};

export const formatBookingDate = (timestamp: number, timezone?: string) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "MMM d, yyyy");
};

export const formatBookingTime = (timestamp: number, timezone?: string) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "p"); // e.g. "2:30 PM"
};

export const formatBookingDateTime = (timestamp: number, timezone?: string) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  const now = timezone ? new TZDate(Date.now(), timezone) : new Date();
  const time = formatBookingTime(timestamp, timezone);

  if (isSameDay(zonedDate, now)) return `Today, ${time}`;
  if (isSameDay(zonedDate, addDays(now, 1))) return `Tomorrow, ${time}`;

  return `${formatBookingDate(timestamp, timezone)}, ${time}`; // e.g. "Jun 11, 2026, 2:30 PM"
};

export const getInitials = (fullName: string): string => {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const formatDuration = (minutes?: number) => {
  if (minutes === undefined) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const formatted = hours.toFixed(1).replace(".0", "");
  return `${formatted} ${hours === 1 ? "hour" : "hours"}`;
};

/** Formats a rand amount (not cents) as ZAR, e.g. 450.5 -> "R450.50". */
export const formatZarFromRands = (rands: number) => {
  return `R${rands.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Formats an amount stored in cents as ZAR, e.g. 45000 -> "R450.00". */
export const formatZar = (cents: number) => formatZarFromRands(cents / 100);

// Matches the Go API's bookings_status_check constraint (see
// expand_booking_status_values migration).
export const getBookingStatusBadge = (
  status: string,
): { label: string; className: string } => {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", className: "bg-blue-400/20 text-blue-600" };
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-amber-400/20 text-amber-600",
      };
    case "completed":
      return { label: "Completed", className: "bg-green-400/25 text-green-600" };
    case "pending":
      return { label: "Pending", className: "bg-muted text-muted-foreground" };
    case "cancelled_by_user":
    case "cancelled_by_salon":
    case "cancelled_payment_failed":
      return {
        label: "Cancelled",
        className: "bg-destructive/10 text-destructive",
      };
    case "no_show":
      return {
        label: "No show",
        className: "bg-orange-400/20 text-orange-600",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        className: "bg-muted text-muted-foreground",
      };
  }
};
