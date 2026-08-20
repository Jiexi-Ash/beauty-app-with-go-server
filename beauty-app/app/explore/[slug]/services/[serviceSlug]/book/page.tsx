"use client"

import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MapPin, Check, CaretLeft, CaretRight, SealCheck } from "@phosphor-icons/react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import MainLayout from "@/components/main-layout"
import { BookingPageSkeleton } from "@/components/skeletons/booking-page"
import { toast } from "sonner"
import { apiClient, ApiError } from "@/lib/api-client"

const toNoonUTC = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))

type SalonResponse = {
  id: string
  name: string
  slug: string
  city: string | null
  phone: string | null
  cover_image_url: string | null
}

type ServiceResponse = {
  id: string
  salon_id: string
  name: string
  category_name: string
  cover_image_url: string | null
  description: string | null
  duration_minutes: number
  slug: string | null
  price_cents: number
  category_id: string
}

type AvailabilityResponse = {
  date: string
  available_slots: string[]
}

function BookServicePage() {
  const params = useParams<{ slug: string; serviceSlug: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(() => toNoonUTC(new Date()))
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const { data: salonData, isLoading: isSalonLoading } = useQuery({
    queryKey: ["salon", params.slug],
    queryFn: () => apiClient.get<{ salon: SalonResponse; services: ServiceResponse[] | null }>(`/salons/${params.slug}`),
  })

  // Go returns `null` (not `[]`) for a nil slice when a salon has no services yet.
  const service = (salonData?.services ?? []).find((s) => s.slug === params.serviceSlug)

  const dateParam = format(selectedDate, "yyyy-MM-dd")
  const { data: availability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ["availability", params.slug, params.serviceSlug, dateParam],
    queryFn: () =>
      apiClient.get<AvailabilityResponse>(
        `/salons/${params.slug}/services/${params.serviceSlug}/availability?date=${dateParam}`,
      ),
    enabled: !!service,
  })

  const weekDays = useMemo(() => {
    const now = new Date()
    const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base + (weekOffset * 7 + i) * 86_400_000)
    )
  }, [weekOffset])

  const handleConfirm = async () => {
    if (!selectedSlot || !service) return
    setIsSubmitting(true)
    try {
      const [hour, minute] = selectedSlot.split(":").map(Number)
      // computeAvailableSlots (Go) now converts salon hours using the salon's
      // own timezone (e.g. Africa/Johannesburg) and formats the "HH:MM" slot
      // label back in that same local time — confirmed live: the valid window
      // for 08:00-20:00 salon hours is exactly [06:00, 18:00) UTC. The public
      // salon API never exposes the salon's timezone string, so — matching
      // this product's existing assumption that it only serves SA users whose
      // browsers are already on SAST — we build the instant from the *local*
      // wall-clock hour/minute (browser-local ≈ salon-local) rather than
      // treating the label as literal UTC.
      const startTime = new Date(selectedDate)
      startTime.setHours(hour, minute, 0, 0)

      await apiClient.post("/bookings", {
        service_id: service.id,
        start_time: startTime.toISOString(),
      })

      setIsBooked(true)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSalonLoading) {
    return <BookingPageSkeleton />
  }

  if (!salonData || !service) {
    return notFound()
  }

  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const monthLabel =
    format(weekStart, "MMMM") === format(weekEnd, "MMMM")
      ? format(weekStart, "MMMM yyyy")
      : `${format(weekStart, "MMM")} – ${format(weekEnd, "MMM yyyy")}`

  const durationHours = Math.floor(service.duration_minutes / 60)
  const durationMinutes = service.duration_minutes % 60
  const durationLabel =
    durationHours > 0
      ? `${durationHours}${durationMinutes > 0 ? `.${durationMinutes}` : ""} hrs`
      : `${durationMinutes} min`

  const priceRands = service.price_cents / 100

  if (isBooked) {
    return (
      <MainLayout>
        <div className="mt-20 max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <SealCheck className="size-8 text-primary" weight="fill" />
          </div>
          <h1 className="text-3xl font-black">Appointment booked!</h1>
          <p className="text-muted-foreground">
            You&apos;re booked for {service.name} at {salonData.salon.name} on{" "}
            {format(selectedDate, "MMM d, yyyy")} at {selectedSlot}.
          </p>
          <Link href={`/explore/${params.slug}`}>
            <Button size="lg" className="rounded-full mt-4">
              Back to salon
            </Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mt-10">
        <Link
          href={`/explore/${params.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6 hover:underline"
        >
          <CaretLeft className="size-4" />
          Back to Salon Profile
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">

          {/* ── Left column ── */}
          <div className="space-y-10">

            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Book Your{" "}
                <span className="text-primary italic">Appointment.</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-md leading-relaxed">
                Review your appointment details and secure your spot.
              </p>
            </div>

            {/*  Dates */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">Select Date &amp; Time</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{monthLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWeekOffset((o) => Math.max(0, o - 1))
                      setSelectedSlot(null)
                    }}
                    disabled={weekOffset === 0}
                    className="size-9 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
                  >
                    <CaretLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setWeekOffset((o) => o + 1)
                      setSelectedSlot(null)
                    }}
                    className="size-9 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <CaretRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Date cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-visible lg:pb-0">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(toNoonUTC(day))
                        setSelectedSlot(null)
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl transition-all snap-start shrink-0",
                        "w-[72px] h-[88px] lg:flex-1 lg:w-auto lg:h-24",
                        isSelected
                          ? "bg-primary text-white shadow-lg scale-105"
                          : "bg-white border border-foreground/10 hover:border-primary/30 hover:shadow-sm",
                      )}
                    >
                      <span className={cn(
                        "text-[11px] uppercase font-semibold tracking-wide",
                        isSelected ? "text-white/75" : "text-muted-foreground"
                      )}>
                        {format(day, "EEE")}
                      </span>
                      <span className="text-2xl font-black mt-0.5">{format(day, "d")}</span>
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              <div className="mt-5">
                {isAvailabilityLoading ? (
                  <p className="text-sm text-muted-foreground">Loading slots...</p>
                ) : !availability?.available_slots || availability.available_slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available slots for this day.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availability.available_slots.map((slot) => {
                      const isSelected = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "rounded-2xl py-3 px-4 text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-primary text-white shadow-md"
                              : "bg-gray-100 hover:bg-gray-200",
                          )}
                        >
                          {slot}
                          {isSelected && <Check className="inline ml-1.5 size-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:hidden">
              <ConfirmBooking
                isSubmitting={isSubmitting}
                service={service}
                salon={salonData.salon}
                durationLabel={durationLabel}
                priceRands={priceRands}
                selectedSlot={selectedSlot}
                onConfirm={handleConfirm}
              />
            </div>

          </div>


          <div className="hidden lg:block sticky top-8">
            <ConfirmBooking
              isSubmitting={isSubmitting}
              service={service}
              salon={salonData.salon}
              durationLabel={durationLabel}
              priceRands={priceRands}
              selectedSlot={selectedSlot}
              onConfirm={handleConfirm}
            />
          </div>

        </div>
      </div>
    </MainLayout>
  )
}


function ConfirmBooking({
  isSubmitting,
  service,
  salon,
  durationLabel,
  priceRands,
  selectedSlot,
  onConfirm,
}: {
  isSubmitting: boolean
  service: ServiceResponse
  salon: SalonResponse
  durationLabel: string
  priceRands: number
  selectedSlot: string | null
  onConfirm: () => void
}) {
  const { isSignedIn } = useAuth()
  const fullPath = typeof window !== "undefined"
    ? window.location.pathname + window.location.search
    : "";
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-foreground/10 overflow-hidden">
      {service.cover_image_url && (
        <div className="relative w-full h-48">
          <Image
            src={service.cover_image_url}
            alt={service.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-black mt-2 capitalize">{salon.name}</h3>
          {salon.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="size-3 shrink-0" />
              {salon.city}
            </p>
          )}
        </div>

        <div className="border-t border-foreground/8 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold capitalize">{service.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Duration: {durationLabel}</p>
            </div>
            <span className="text-sm font-bold shrink-0">R{priceRands.toFixed(2)}</span>
          </div>
        </div>

        {selectedSlot && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
            <p className="text-[11px] uppercase font-semibold text-primary tracking-widest mb-0.5">
              Selected Time
            </p>
            <p className="text-sm font-bold">{selectedSlot}</p>
          </div>
        )}

        {isSignedIn ?
          <Button
            size="lg"
            className="w-full rounded-full text-base font-bold py-6 bg-primary hover:bg-primary/90"
            disabled={!selectedSlot || isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Processing..." : "Confirm Appointment"}
          </Button> : <Link href={`/sign-in?redirect_url=${encodeURIComponent(fullPath)}`}>
            <Button
              size="lg"
              className="w-full rounded-full text-base font-bold py-6 bg-primary hover:bg-primary/90"
            >
              Sign In to Book An Appointment
            </Button>
          </Link>
        }
      </div>
    </div>
  )
}

export default BookServicePage
