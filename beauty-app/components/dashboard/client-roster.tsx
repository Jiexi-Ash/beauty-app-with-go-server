"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FunnelSimple, MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { formatZarFromRands } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";

const PAGE_SIZE = 8;
const ACTIVE_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

const ACTIVITY_FILTERS = [
  { value: "all", label: "All clients" },
  { value: "active", label: "Active (last 60 days)" },
  { value: "lapsed", label: "Lapsed (60+ days)" },
] as const;

type Client = {
  customerId: string;
  name: string;
  email: string;
  totalBookings: number;
  revenue: number;
  lastVisit: number;
};

function ClientRoster() {
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<(typeof ACTIVITY_FILTERS)[number]["value"]>("all");
  const [page, setPage] = useState(0);
  const [now] = useState(() => Date.now());

  const isLoading = bookingsLoading || servicesLoading;
  const serviceMap = new Map((services ?? []).map((s) => [s.ID, s]));

  const clients = useMemo<Client[]>(() => {
    const byCustomer = new Map<string, OwnerBooking[]>();
    (bookings ?? []).forEach((b) => {
      const list = byCustomer.get(b.customer_id) ?? [];
      list.push(b);
      byCustomer.set(b.customer_id, list);
    });

    return Array.from(byCustomer.entries()).map(([customerId, customerBookings]) => {
      const completed = customerBookings.filter((b) => b.status === "completed");
      const revenue =
        completed.reduce((sum, b) => sum + (serviceMap.get(b.service_id)?.PriceCents ?? 0), 0) / 100;
      const lastVisit = Math.max(...customerBookings.map((b) => new Date(b.start_time).getTime()));
      const latest = customerBookings[0];
      const name = [latest.customer_name, latest.customer_surname].filter(Boolean).join(" ");
      return {
        customerId,
        name,
        email: latest.customer_email,
        totalBookings: customerBookings.length,
        revenue,
        lastVisit,
      };
    });
  }, [bookings, serviceMap]);

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (activity !== "all") {
        const isActive = now - c.lastVisit <= ACTIVE_WINDOW_MS;
        if (activity === "active" ? !isActive : isActive) return false;
      }
      if (!term) return true;
      return [c.name, c.email].filter(Boolean).some((v) => v.toLowerCase().includes(term));
    });
  }, [clients, activity, now, term]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const onActivityChange = (value: string | null) => {
    if (!value) return;
    setActivity(value as (typeof ACTIVITY_FILTERS)[number]["value"]);
    setPage(0);
  };

  return (
    <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold md:text-3xl">Client Roster</h1>
          <p className="text-sm text-muted-foreground">
            Manage your community and track relationships.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:w-[240px] focus-within:ring-1 focus-within:ring-foreground/10">
            <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search clients..."
              className="h-auto w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Select value={activity} onValueChange={onActivityChange}>
            <SelectTrigger className="h-10 w-full bg-muted sm:w-[210px]">
              <FunnelSimple className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 flex flex-col gap-3 lg:hidden">
        {isLoading ? null : visible.length === 0 ? (
          <EmptyState
            icon={UsersThree}
            className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground"
            message={
              clients.length === 0
                ? "No clients yet. They'll appear here once they book."
                : "No clients match your filters."
            }
          />
        ) : (
          visible.map((client) => (
            <div key={client.customerId} className="rounded-xl border border-border p-4">
              <p className="truncate font-bold">{client.name || client.email}</p>
              <p className="truncate text-xs text-muted-foreground">{client.email}</p>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Appointments</p>
                  <p className="text-sm font-semibold">{client.totalBookings}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Revenue</p>
                  <p className="text-sm font-semibold">{formatZarFromRands(client.revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Last visit</p>
                  <p className="text-sm font-semibold">
                    {formatDistanceToNow(client.lastVisit, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table */}
      <Card className="mt-6 hidden lg:block">
        <CardContent className="p-0">
        <Table className="border-collapse">
          <TableHeader className="bg-muted [&_tr]:border-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                CLIENT
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                TOTAL APPOINTMENTS
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                PROCESSED REVENUE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                LAST VISIT
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? null : visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                  <EmptyState
                    icon={UsersThree}
                    message={
                      clients.length === 0
                        ? "No clients yet. They'll appear here once they book."
                        : "No clients match your filters."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              visible.map((client) => (
                <TableRow
                  key={client.customerId}
                  className="group border-b border-border hover:bg-transparent last:border-b-0"
                >
                  <TableCell className="p-6">
                    <div className="flex flex-col">
                      <span className="max-w-[220px] truncate font-bold">{client.name || client.email}</span>
                      {client.name && (
                        <span className="max-w-[220px] truncate text-xs text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-6 text-sm font-semibold">
                    {client.totalBookings}
                  </TableCell>
                  <TableCell className="p-6 text-sm font-semibold">
                    {formatZarFromRands(client.revenue)}
                  </TableCell>
                  <TableCell className="p-6 text-sm text-muted-foreground">
                    {formatDistanceToNow(client.lastVisit, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No clients"
            : `Showing ${start + 1} to ${start + visible.length} of ${filtered.length} clients`}
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

export default ClientRoster;
