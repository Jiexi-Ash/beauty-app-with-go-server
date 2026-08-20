"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { CalendarX, DotsThreeVertical, Eye } from "@phosphor-icons/react";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { formatBookingDateTime, formatBookingTime, formatDuration, getBookingStatusBadge } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "../ui/skeleton";
import { WidgetError } from "./widget-error";
import { EmptyState } from "./empty-state";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";
import { customerDisplayName } from "@/lib/api-types";

const UPCOMING_STATUSES = ["pending", "confirmed", "in_progress"];

function isTodayOrTomorrow(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const dayDiff = Math.floor(
    (new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86_400_000,
  );
  return dayDiff === 0 || dayDiff === 1;
}

function UpcomingBookings() {
  const { data: bookings, isLoading: bookingsLoading, isError, refetch } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });

  const serviceMap = new Map((services ?? []).map((s) => [s.ID, s]));
  const upcoming = (bookings ?? [])
    .filter((b) => UPCOMING_STATUSES.includes(b.status) && isTodayOrTomorrow(b.start_time))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const isLoading = bookingsLoading || servicesLoading;

  return (
    <div className="mb-6">
      <BookingsMobile bookings={upcoming} serviceMap={serviceMap} isLoading={isLoading} isError={isError} onRetry={refetch} />
      <BookingsDesktop bookings={upcoming} serviceMap={serviceMap} isLoading={isLoading} isError={isError} onRetry={refetch} />
    </div>
  );
}

export default UpcomingBookings;

interface BookingsProps {
  bookings: OwnerBooking[];
  serviceMap: Map<string, OwnerService>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const BookingsDesktop = ({ bookings, serviceMap, isLoading, isError, onRetry }: BookingsProps) => {
  return (
    <Card className="hidden sm:block">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-bold">Upcoming appointments</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <WidgetError
            message="Couldn't load your upcoming appointments."
            onRetry={onRetry}
          />
        ) : (
          <>
            <div className="w-full grid grid-cols-4 bg-muted py-3 px-2 rounded">
              <div className="uppercase text-muted-foreground  text-xs font-semibold">
                Customer
              </div>
              <div className="uppercase text-muted-foreground  text-xs font-semibold">
                Service
              </div>
              <div className="uppercase text-muted-foreground  text-xs font-semibold">
                Date & Time
              </div>
              <div className="uppercase text-muted-foreground  text-xs font-semibold">
                Actions
              </div>
            </div>

            {isLoading ? (
              <DesktopRowsSkeleton />
            ) : bookings.length === 0 ? (
              <EmptyBookings />
            ) : (
              bookings.map((booking) => {
                const service = serviceMap.get(booking.service_id);
                const statusBadge = getBookingStatusBadge(booking.status);
                return (
                  <div key={booking.id} className="w-full grid grid-cols-4 items-center">
                    <span className="font-bold text-xs">{customerDisplayName(booking)}</span>
                    <div className="text-muted-foreground text-sm capitalize">{service?.Name ?? "Service"}</div>
                    <div className="flex flex-col gap-0.5 ">
                      <span className="font-bold text-xs">{formatBookingDateTime(new Date(booking.start_time).getTime())}</span>
                      {service && (
                        <span className="text-muted-foreground text-xs">
                          Duration: {formatDuration(service.DurationMinutes)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                      <BookingActions bookingId={booking.id} />
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const BookingsMobile = ({ bookings, serviceMap, isLoading, isError, onRetry }: BookingsProps) => {
  return (
    <Card className="block sm:hidden mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-bold">Upcoming appointments</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <WidgetError
            message="Couldn't load your upcoming appointments."
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <MobileRowsSkeleton />
        ) : bookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          bookings.map((booking) => {
            const service = serviceMap.get(booking.service_id);
            const statusBadge = getBookingStatusBadge(booking.status);
            return (
              <div key={booking.id} className="flex items-center gap-3 justify-between">
                <div className="flex flex-col gap-1 mt-4">
                  <div className="flex items-center">
                    <span className="font-bold text-xs">{customerDisplayName(booking)}</span>
                    <span className="mx-1.5 text-muted-foreground" aria-hidden>·</span>
                    <div className="text-muted-foreground text-xs capitalize">
                      <span>{service?.Name ?? "Service"}</span>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground">{formatBookingTime(new Date(booking.start_time).getTime())}</span>

                  <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                </div>

                <BookingActions bookingId={booking.id} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

const EmptyBookings = () => (
  <EmptyState
    icon={CalendarX}
    className="py-10 text-center"
    message="No upcoming appointments"
    description="Your schedule is clear. New appointments will appear here as soon as clients reserve a spot."
  />
);

const DesktopRowsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full grid grid-cols-4 items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      ))}
    </>
  );
};

const MobileRowsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
    </>
  );
};

const BookingActions = ({ bookingId }: { bookingId: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Actions" />}
      >
        <DotsThreeVertical className="size-6 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Link href={`/dashboard/appointments/${bookingId}`} className="flex items-center gap-2">
            <Eye className="size-4" />
            View
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
