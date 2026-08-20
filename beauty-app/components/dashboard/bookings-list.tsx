"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CalendarX, Eye, FunnelSimple } from "@phosphor-icons/react";
import { cn, formatBookingDateTime, getBookingStatusBadge } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";
import { customerDisplayName } from "@/lib/api-types";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function BookingsList() {
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [page, setPage] = useState(0);

  const isLoading = bookingsLoading || servicesLoading;
  const serviceMap = new Map((services ?? []).map((s) => [s.ID, s]));
  const allBookings = bookings ?? [];

  const filtered = allBookings
    .filter((b) => {
      if (status === "all") return true;
      if (status === "cancelled") return b.status.startsWith("cancelled");
      return b.status === status;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onStatusChange = (value: string | null) => {
    if (!value) return;
    setStatus(value as (typeof STATUS_FILTERS)[number]["value"]);
    setPage(0);
  };

  return (
    <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold md:text-3xl">
            Appointments
          </h1>
          <p className="text-sm text-muted-foreground">
            Every appointment made with your business, past and upcoming.
          </p>
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-full bg-muted sm:w-[170px]">
            <FunnelSimple className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 flex flex-col gap-3 lg:hidden">
        {isLoading ? null : visible.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground"
            message={
              allBookings.length === 0
                ? "No appointments yet. They'll appear here once clients book."
                : "No appointments match your filters."
            }
          />
        ) : (
          visible.map((booking) => {
            const statusBadge = getBookingStatusBadge(booking.status);
            const service = serviceMap.get(booking.service_id);
            return (
              <Link
                key={booking.id}
                href={`/dashboard/appointments/${booking.id}`}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{customerDisplayName(booking)}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {service?.Name ?? "Service"}
                    </p>
                  </div>
                  <Eye className="size-5 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-semibold">
                    {formatBookingDateTime(new Date(booking.start_time).getTime())}
                  </span>
                  <Badge className={cn("font-medium", statusBadge.className)}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Table */}
      <Card className="mt-6 hidden lg:block">
        <CardContent className="p-0">
        <Table className="border-collapse">
          <TableHeader className="bg-muted [&_tr]:border-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                CUSTOMER
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                SERVICE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                DATE &amp; TIME
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                STATUS
              </TableHead>
              <TableHead className="h-auto w-12 bg-muted px-6 py-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? null : visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  <EmptyState
                    icon={CalendarX}
                    message={
                      allBookings.length === 0
                        ? "No appointments yet. They'll appear here once clients book."
                        : "No appointments match your filters."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              visible.map((booking) => {
                const statusBadge = getBookingStatusBadge(booking.status);
                const service = serviceMap.get(booking.service_id);
                return (
                  <TableRow
                    key={booking.id}
                    className="group border-b border-border hover:bg-transparent last:border-b-0"
                  >
                    <TableCell className="p-6">
                      <span className="max-w-[220px] truncate font-bold block">
                        {customerDisplayName(booking)}
                      </span>
                    </TableCell>
                    <TableCell className="p-6 text-sm capitalize text-muted-foreground">
                      {service?.Name ?? "Service"}
                    </TableCell>
                    <TableCell className="p-6 text-sm font-semibold">
                      {formatBookingDateTime(new Date(booking.start_time).getTime())}
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge className={cn("font-medium", statusBadge.className)}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View appointment"
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Link href={`/dashboard/appointments/${booking.id}`}>
                          <Eye className="size-5 text-muted-foreground" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No appointments"
            : `Showing ${start + 1} to ${start + visible.length} of ${filtered.length} appointments`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingsList;
