"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  CalendarCheck,
  CalendarDots,
  CaretRight,
  CheckCircle,
  ClockCounterClockwise,
  PlayCircle,
  Prohibit,
  Scissors,
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  cn,
  formatBookingDate,
  formatBookingTime,
  formatDuration,
  formatZar,
  getBookingStatusBadge,
  getInitials,
} from "@/lib/utils";
import { NO_SHOW_CORRECTION_WINDOW_HOURS } from "@/constants";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";
import { customerDisplayName } from "@/lib/api-types";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback } from "../ui/avatar";

function BookingDetails({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });
  const [pendingAction, setPendingAction] = useState<
    "start" | "complete" | "cancel" | "update-no-show" | null
  >(null);
  const [now] = useState(() => Date.now());

  const isLoading = bookingsLoading || servicesLoading;
  const booking = (bookings ?? []).find((b) => b.id === bookingId);
  const service = booking ? (services ?? []).find((s) => s.ID === booking.service_id) : undefined;

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      apiClient.patch(`/owner/bookings/${bookingId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not update this appointment.");
    },
  });

  if (isLoading) {
    return (
      <div className="w-full px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!booking) return notFound();

  const handleAction = async (status: string, action: typeof pendingAction) => {
    try {
      setPendingAction(action);
      await updateStatus.mutateAsync(status);
      toast.success("Appointment updated");
    } finally {
      setPendingAction(null);
    }
  };

  const history = (bookings ?? [])
    .filter((b) => b.customer_id === booking.customer_id && b.id !== booking.id)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const isPending = booking.status === "pending" || booking.status === "confirmed";
  const isInProgress = booking.status === "in_progress";
  const isNoShow = booking.status === "no_show";
  const canCancel = isPending && new Date(booking.start_time).getTime() > now;
  const canUpdateNoShow =
    isNoShow &&
    now <= new Date(booking.end_time).getTime() + NO_SHOW_CORRECTION_WINDOW_HOURS * 60 * 60 * 1000;

  const statusBadge = getBookingStatusBadge(booking.status);

  return (
    <div className="w-full px-6 py-6 2xl:max-w-[1600px] 2xl:mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/dashboard/appointments" className="hover:text-primary">
              Appointments
            </Link>
            <CaretRight className="size-3" />
            <span className="text-primary font-medium">Appointment Details</span>
          </div>
          <h1 className="mt-1 text-2xl font-headline font-bold">Review Appointment</h1>
        </div>

        {isPending && (
          <div className="flex flex-wrap items-center gap-3">
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="lg"
                      className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                    />
                  }
                >
                  Cancel Appointment
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10">
                      <Prohibit className="text-destructive" weight="fill" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pendingAction === "cancel"}>
                      Keep appointment
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={pendingAction === "cancel"}
                      onClick={() => handleAction("cancelled_by_salon", "cancel")}
                    >
                      {pendingAction === "cancel" ? "Cancelling..." : "Cancel appointment"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="lg"
                    className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                  />
                }
              >
                Start Appointment
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-primary/10">
                    <PlayCircle className="text-primary" weight="fill" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Start this appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This marks it as in progress. Only start it once the client has arrived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pendingAction === "start"}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pendingAction === "start"}
                    onClick={() => handleAction("in_progress", "start")}
                  >
                    {pendingAction === "start" ? "Starting..." : "Start appointment"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {isInProgress && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="lg"
                  className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                />
              }
            >
              Mark as Completed
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-primary/10">
                  <CheckCircle className="text-primary" weight="fill" />
                </AlertDialogMedia>
                <AlertDialogTitle>Mark as completed?</AlertDialogTitle>
                <AlertDialogDescription>
                  Only do this once the service has actually finished.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pendingAction === "complete"}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={pendingAction === "complete"}
                  onClick={() => handleAction("completed", "complete")}
                >
                  {pendingAction === "complete" ? "Completing..." : "Mark as completed"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canUpdateNoShow && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                />
              }
            >
              <ClockCounterClockwise className="size-4" />
              Update to Completed
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-primary/10">
                  <CheckCircle className="text-primary" weight="fill" />
                </AlertDialogMedia>
                <AlertDialogTitle>Update to completed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This was automatically marked as a no-show. If the client actually attended
                  and you forgot to start the appointment, you can update it to completed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pendingAction === "update-no-show"}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={pendingAction === "update-no-show"}
                  onClick={() => handleAction("completed", "update-no-show")}
                >
                  {pendingAction === "update-no-show" ? "Updating..." : "Mark as completed"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Body: 3 columns */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        {/* Column 1: customer, appointment */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Avatar size="xl" className="size-14">
                <AvatarFallback className="text-lg">
                  {getInitials(customerDisplayName(booking))}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-headline font-bold">{customerDisplayName(booking)}</h2>
                {(booking.customer_name || booking.customer_surname) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{booking.customer_email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Appointment
                </span>
                <CalendarDots className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold capitalize">{service?.Name ?? "Service"}</h3>
                  <Badge className={cn("text-[10px] font-medium", statusBadge.className)}>
                    {statusBadge.label}
                  </Badge>
                </div>
                {service && (
                  <p className="text-xs text-muted-foreground">
                    Duration: {formatDuration(service.DurationMinutes)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <CalendarCheck className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Scheduled for
                  </p>
                  <p className="text-sm font-bold">
                    {formatBookingDate(new Date(booking.start_time).getTime())} •{" "}
                    {formatBookingTime(new Date(booking.start_time).getTime())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: service details */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Service Details
                </span>
                <Scissors className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {service?.CoverImageUrl && (
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                  <Image
                    src={service.CoverImageUrl}
                    alt={service.Name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              )}
              <h3 className="text-lg font-headline font-bold capitalize">{service?.Name ?? "Service"}</h3>

              {service && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Listed price
                    </p>
                    <p className="text-base font-bold">
                      {formatZar(service.PriceCents)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Duration
                    </p>
                    <p className="text-base font-bold">
                      {formatDuration(service.DurationMinutes)}
                    </p>
                  </div>
                </div>
              )}

              {service?.Description && (
                <div>
                  <p className="mb-1 text-[10px] uppercase text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">{service.Description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: booking history */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-headline font-bold">
                Appointment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This is the customer&apos;s first appointment with you.
                </p>
              ) : (
                <ol className="relative space-y-5 border-l border-border pl-5">
                  {history.map((item) => {
                    const itemService = (services ?? []).find((s) => s.ID === item.service_id);
                    return (
                      <li key={item.id} className="relative">
                        <span className="absolute -left-[27px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <p className="text-sm font-semibold capitalize">
                          {itemService?.Name ?? "Service"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBookingDate(new Date(item.start_time).getTime())} •{" "}
                          {itemService ? formatZar(itemService.PriceCents) : ""}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;
