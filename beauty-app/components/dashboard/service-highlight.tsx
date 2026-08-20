"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { WidgetError } from "./widget-error";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";

function isThisMonth(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function ServiceHighlight() {
  const { data: bookings, isLoading: bookingsLoading, isError, refetch } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });

  const isLoading = bookingsLoading || servicesLoading;
  const serviceMap = new Map((services ?? []).map((s) => [s.ID, s]));

  const counts = new Map<string, number>();
  (bookings ?? [])
    .filter((b) => isThisMonth(b.start_time))
    .forEach((b) => counts.set(b.service_id, (counts.get(b.service_id) ?? 0) + 1));

  const topServices = Array.from(counts.entries())
    .map(([serviceId, count]) => ({ serviceId, count, name: serviceMap.get(serviceId)?.Name ?? "Service" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topService = topServices[0];

  return (
    <Card className="lg:w-[300px]">
      <CardHeader>
        <CardTitle className="font-bold">Service Highlight</CardTitle>
        <CardDescription className="text-xs">
          {isError ? (
            "Couldn't load your service highlights."
          ) : isLoading ? (
            <Skeleton className="h-3 w-48" />
          ) : topService ? (
            `${topService.name} is your top performing service this month with ${topService.count} ${topService.count === 1 ? "appointment" : "appointments"}`
          ) : (
            "No appointments yet this month. Your top services will show up here."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="flex-1 space-y-2">
          {isError ? (
            <WidgetError
              message="Couldn't load service highlights."
              onRetry={() => refetch()}
              className="min-h-[120px] py-0"
            />
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted flex items-center justify-between p-2 rounded-lg"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))
          ) : topServices.length === 0 ? (
            <div className="flex h-full min-h-[120px] items-center justify-center">
              <p className="text-muted-foreground text-xs text-center">
                No services have been booked this month yet.
              </p>
            </div>
          ) : (
            topServices.map((service) => (
              <div
                key={service.serviceId}
                className="bg-muted flex items-center justify-between p-2 rounded-lg"
              >
                <span className="font-medium capitalize">
                  {service.name}
                </span>
                <Badge className="bg-primary/10 text-primary">
                  {service.count} {service.count === 1 ? "Appointment" : "Appointments"}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <Button className="w-full cursor-pointer" size="lg">
            <Link href="/dashboard/services">Manage services</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceHighlight;
