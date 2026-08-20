"use client";
import Image from "next/image";
import Link from "next/link";
import { CalendarBlank, Clock, MapPin, SealCheck } from "@phosphor-icons/react";
import Navbar from "@/components/navbar";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatBookingTime, getBookingStatusBadge } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/footer";
import { BookingConfirmationSkeleton } from "@/components/skeletons/booking-confirmation";

type Booking = {
  ID: string;
  SalonID: string;
  ServiceID: string;
  StartTime: string;
  Status: string;
};

type Salon = { id: string; name: string; city: string | null; cover_image_url: string | null };
type Service = { id: string; name: string };

function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading: bookingLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => apiClient.get<Booking>(`/bookings/${id}`),
    retry: false,
  });
  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ["salons"],
    queryFn: () => apiClient.get<Salon[] | null>("/salons"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => apiClient.get<Service[] | null>("/services"),
  });

  const isLoading = bookingLoading || salonsLoading || servicesLoading;

  if (isLoading) return <BookingConfirmationSkeleton />;
  if (!booking || (error instanceof ApiError && error.status === 404)) return notFound();

  const salon = (salons ?? []).find((s) => s.id === booking.SalonID);
  const service = (services ?? []).find((s) => s.id === booking.ServiceID);
  const startMs = new Date(booking.StartTime).getTime();
  const statusBadge = getBookingStatusBadge(booking.Status);

  const toGCalDate = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, "");

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${service?.name ?? "Appointment"} at ${salon?.name ?? "salon"}`,
  )}&dates=${toGCalDate(startMs)}/${toGCalDate(startMs + 30 * 60_000)}&details=${encodeURIComponent(
    `Appointment at ${salon?.name ?? "salon"}`,
  )}&location=${encodeURIComponent(salon?.city ?? salon?.name ?? "")}`;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    salon?.city ?? salon?.name ?? "",
  )}`;

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <SealCheck weight="fill" className="size-8 text-primary" />
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          See you soon!
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Your appointment at
          <span className="text-primary font-medium mx-1">{salon?.name ?? "the salon"}</span>
          is booked.
        </p>

        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs font-semibold tracking-widest border rounded-full px-3 py-1 uppercase ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>

            <h2 className="font-headline text-2xl font-bold text-foreground mb-5 leading-tight uppercase">
              {service?.name ?? "Appointment"}
            </h2>

            <div className="flex gap-8 mb-6">
              <div className="flex items-center gap-2">
                <CalendarBlank className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(startMs).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatBookingTime(startMs)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 mb-5" />

            <div className="flex gap-3">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-primary text-white font-semibold py-3 rounded-full hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                Add to Calendar
              </a>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center border-2 border-primary text-primary font-semibold py-3 rounded-full hover:bg-primary/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                View Directions
              </a>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-3xl bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden p-0">
          <CardContent className="p-0 flex flex-col">
            <div className="relative w-full h-48 md:h-56">
              <Image
                src={salon?.cover_image_url ?? "/salon-image-placeholder.jpg"}
                fill
                alt="business cover image"
                className="object-cover"
              />
            </div>

            <div className="p-6">
              <h3 className="font-headline text-xl font-bold text-foreground mb-1">
                {salon?.name}
              </h3>
              {salon?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="text-muted-foreground size-4 shrink-0" />
                  <p className="text-muted-foreground text-sm">{salon.city}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Link
          href="/profile/bookings"
          className="mt-6 text-sm text-primary font-medium hover:underline"
        >
          Go to My Bookings
        </Link>
      </div>

      <Footer />
    </div>
  );
}

export default BookingConfirmationPage;
