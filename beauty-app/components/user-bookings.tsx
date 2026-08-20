"use client"
import { useMemo, useState } from 'react'
import MainLayout from './main-layout'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Star, Warning } from '@phosphor-icons/react'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, ApiError } from '@/lib/api-client'
import { cn, formatBookingShortDate, getBookingStatusBadge } from '@/lib/utils'
import NoBookings from './bookings/no-boookings'

type Booking = {
    ID: string
    SalonID: string
    ServiceID: string
    StartTime: string
    EndTime: string
    Status: string
}

type Salon = { id: string; name: string; slug: string; city: string | null; cover_image_url: string | null }
type Service = { id: string; name: string; duration_minutes: number }
type MyReview = { BookingID: string }

function useEnrichedBookings() {
    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ["bookings"],
        queryFn: () => apiClient.get<Booking[] | null>("/bookings"),
    })
    const { data: salons, isLoading: salonsLoading } = useQuery({
        queryKey: ["salons"],
        queryFn: () => apiClient.get<Salon[] | null>("/salons"),
    })
    const { data: services, isLoading: servicesLoading } = useQuery({
        queryKey: ["services"],
        queryFn: () => apiClient.get<Service[] | null>("/services"),
    })

    const salonMap = new Map((salons ?? []).map((s) => [s.id, s]))
    const serviceMap = new Map((services ?? []).map((s) => [s.id, s]))

    const enriched = (bookings ?? []).map((b) => ({
        ...b,
        salon: salonMap.get(b.SalonID) ?? null,
        service: serviceMap.get(b.ServiceID) ?? null,
    }))

    return { bookings: enriched, isLoading: bookingsLoading || salonsLoading || servicesLoading }
}

type EnrichedBooking = ReturnType<typeof useEnrichedBookings>["bookings"][number]

type BookingCardVariant = "upcoming" | "completed" | "cancelled"

function BookingCard({
    booking,
    variant,
    alreadyReviewed,
}: {
    booking: EnrichedBooking
    variant: BookingCardVariant
    alreadyReviewed: boolean
}) {
    const [reviewOpen, setReviewOpen] = useState(false)
    const statusBadge = getBookingStatusBadge(booking.Status)
    const showReview = variant === "completed"

    return (
        <>
            <Card className="rounded-2xl ring-1 ring-black/5 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <CardContent className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 shrink-0">
                            <div className="h-14 w-14 rounded-full relative overflow-hidden">
                                <Image src={booking.salon?.cover_image_url ?? "/salon-image-placeholder.jpg"} alt={`${booking.salon?.name ?? "Salon"} photo`} fill className="object-cover" />
                            </div>
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <h2 className="font-headline font-bold truncate">{booking.salon?.name ?? "Salon"}</h2>
                                {booking.Status === "pending" && (
                                    <Badge className="bg-amber-400/20 text-amber-600 font-medium shrink-0">Pending</Badge>
                                )}
                                {booking.Status === "in_progress" && (
                                    <Badge className="bg-primary/10 text-primary font-medium">In progress</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap text-sm">
                                <p className="capitalize font-medium">{booking.service?.name ?? "Service"}</p>
                                <span className="text-muted-foreground/50">&bull;</span>
                                <span>{formatBookingShortDate(new Date(booking.StartTime).getTime())}</span>
                            </div>
                        </div>
                    </div>

                    {variant !== "completed" && (
                        <Badge className={cn("font-medium shrink-0", statusBadge.className)}>{statusBadge.label}</Badge>
                    )}

                    {showReview && (
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {alreadyReviewed ? (
                                <Badge className="bg-primary/10 text-primary font-medium">Reviewed</Badge>
                            ) : (
                                <Button
                                    className="text-primary"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReviewOpen(true)}
                                >
                                    Leave a review
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showReview && (
                <ReviewDialog
                    open={reviewOpen}
                    onOpenChange={setReviewOpen}
                    booking={booking}
                />
            )}
        </>
    )
}

interface ReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking: EnrichedBooking
}

function ReviewDialog({ open, onOpenChange, booking }: ReviewDialogProps) {
    const queryClient = useQueryClient()
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const { mutate: submitReview, isPending } = useMutation({
        mutationFn: () =>
            apiClient.post("/reviews", {
                booking_id: booking.ID,
                rating,
                comment: comment.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews-mine"] })
            toast.success("Review submitted. Thanks for the feedback!")
            onOpenChange(false)
            setRating(0)
            setComment("")
        },
        onError: (error) => {
            setErrorMessage(error instanceof ApiError ? error.message : "Your review could not be submitted.")
        },
    })

    const handleSubmit = () => {
        if (rating < 1) return
        submitReview()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline font-bold">Leave a review</DialogTitle>
                        <DialogDescription>
                            How was your <span className="font-bold capitalize">{booking.service?.name}</span> appointment at{" "}
                            <span className="font-bold text-primary">{booking.salon?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rating">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const value = i + 1
                                const filled = value <= (hoverRating || rating)
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                                        aria-pressed={rating === value}
                                        onClick={() => setRating(value)}
                                        onMouseEnter={() => setHoverRating(value)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        disabled={isPending}
                                        className="p-1 transition-transform hover:scale-110 disabled:pointer-events-none"
                                    >
                                        <Star
                                            weight={filled ? "fill" : "regular"}
                                            className={cn("size-8", filled ? "text-amber-500" : "text-muted-foreground/40")}
                                        />
                                    </button>
                                )
                            })}
                        </div>

                        <div className="space-y-1.5">
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                                placeholder="Share a few words about your experience (optional)"
                                disabled={isPending}
                                maxLength={300}
                                className="min-h-24"
                            />
                            <p className="text-right text-xs text-muted-foreground">{comment.length}/300</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            size="lg"
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={rating < 1 || isPending}
                            size="lg"
                            className="rounded-full active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        >
                            {isPending ? "Submitting..." : "Submit review"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!errorMessage} onOpenChange={(next) => !next && setErrorMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Warning className="size-8 text-destructive shrink-0 text-center w-full" />
                        <AlertDialogTitle className="w-full text-center font-headline">Could not submit review</AlertDialogTitle>
                        <AlertDialogDescription className="w-full text-center">
                            {errorMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="lg:justify-center">
                        <AlertDialogAction onClick={() => setErrorMessage(null)} className="rounded-full">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function UserBookings() {
    const { bookings, isLoading } = useEnrichedBookings()
    const { data: myReviews } = useQuery({
        queryKey: ["reviews-mine"],
        queryFn: () => apiClient.get<MyReview[] | null>("/reviews/mine"),
    })
    const reviewedBookingIds = new Set((myReviews ?? []).map((r) => r.BookingID))

    const upcomingBookings = useMemo(() =>
        bookings.filter(b => b.Status === "pending" || b.Status === "confirmed" || b.Status === "in_progress")
        , [bookings])

    const completedBookings = useMemo(() =>
        bookings.filter(b => b.Status === "completed")
        , [bookings])

    const cancelledBookings = useMemo(() =>
        bookings.filter(b => b.Status.startsWith("cancelled") || b.Status === "no_show")
        , [bookings])

    const hasVisibleBookings = upcomingBookings.length > 0 || completedBookings.length > 0 || cancelledBookings.length > 0

    if (isLoading) return null
    if (!hasVisibleBookings) return <NoBookings />

    return (
        <MainLayout>
            <div className="space-y-4 w-full">
                <div>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="font-headline font-bold text-2xl">My Bookings</h1>
                            <p className="text-muted-foreground">Manage your upcoming sessions and history.</p>
                        </div>
                        <Tabs defaultValue="upcoming" className="w-full mt-3 md:mt-6">
                            <TabsList className="w-full rounded-full bg-muted p-1 py-6 md:w-fit">
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="upcoming">Upcoming</TabsTrigger>
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="completed">Completed</TabsTrigger>
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="cancelled">Cancelled</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upcoming" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {upcomingBookings.map((booking) => (
                                        <BookingCard key={booking.ID} booking={booking} variant="upcoming" alreadyReviewed={false} />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="completed" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {completedBookings.map((booking) => (
                                        <BookingCard
                                            key={booking.ID}
                                            booking={booking}
                                            variant="completed"
                                            alreadyReviewed={reviewedBookingIds.has(booking.ID)}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="cancelled" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cancelledBookings.map((booking) => (
                                        <BookingCard key={booking.ID} booking={booking} variant="cancelled" alreadyReviewed={false} />
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

            </div>
        </MainLayout>
    )
}

export default UserBookings
