"use client"
import { Heart, MapPin, CircleNotch, ArrowUpRight, Star } from "@phosphor-icons/react"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

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

type Review = {
  ID: string
  Rating: number
  Comment: string | null
  CreatedAt: string
}

type FavoriteSalon = { Slug: string }

interface BusinessProfileProps {
  business: { salon: SalonResponse; services: ServiceResponse[] | null }
}

function BusinessProfile({ business }: BusinessProfileProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [detailService, setDetailService] = useState<ServiceResponse | null>(null)
  const { salon } = business
  // Go returns `null` (not `[]`) for a nil slice when a salon has no services yet.
  const services = business.services ?? []
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiClient.get<FavoriteSalon[] | null>("/favorites"),
    enabled: isSignedIn,
  })
  const isFavorited = (favorites ?? []).some((f) => f.Slug === salon.slug)

  const { mutate: toggleFavorite, isPending: isFavoriting } = useMutation({
    mutationFn: () => apiClient.post<{ favorited: boolean }>(`/favorites/${salon.slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong.")
    },
  })

  const { data: reviews } = useQuery({
    queryKey: ["reviews", salon.slug],
    queryFn: () => apiClient.get<Review[] | null>(`/salons/${salon.slug}/reviews`),
  })
  const reviewList = reviews ?? []
  const averageRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.Rating, 0) / reviewList.length
      : 0

  const handleToggleFavorite = () => {
    if (!isSignedIn) {
      toast.error("Sign in to save salons to your favorites.")
      return
    }
    toggleFavorite()
  }

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId((prev) => (prev === serviceId ? null : serviceId))
    const service = services.find((s) => s.id === serviceId)
    if (service) setDetailService(service)
  }

  return (
    <div className="w-full min-h-screen">
      {/* Cover image */}
      <div className="w-[calc(100%+3rem)] md:w-full h-[360px] md:h-[500px] relative -mx-6 md:mx-0 -mt-4 md:mt-0 md:overflow-hidden md:rounded-4xl">
        <Image
          src={salon.cover_image_url ?? "/salon-image-placeholder.jpg"}
          fill
          className="object-cover object-top"
          alt={`${salon.name} cover`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-5 pb-5">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{salon.name}</h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                {reviewList.length > 0 && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <Star className="size-3.5 md:size-4 text-amber-400" weight="fill" />
                    <span className="text-xs md:text-sm font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-xs md:text-sm text-gray-500">({reviewList.length})</span>
                  </div>
                )}
                {salon.city && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="size-3.5 md:size-4 text-primary" weight="fill" />
                    <span className="text-xs md:text-sm">{salon.city}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              disabled={isFavoriting}
              size="icon"
              className="bg-white/95 rounded-full p-2.5 md:p-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.96]"
              onClick={handleToggleFavorite}
            >
              {isFavoriting ? (
                <CircleNotch className="size-4 text-gray-400 animate-spin" />
              ) : isFavorited ? (
                <Heart weight="fill" className="size-4 md:size-5 text-primary" />
              ) : (
                <Heart className="size-4 md:size-5 text-primary" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            {/* Services grid */}
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-bold">Our services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServiceId === service.id}
                    onSelect={handleSelectService}
                  />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-4 pb-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold">Reviews</h3>
                <span className="text-sm text-muted-foreground">({reviewList.length})</span>
                {reviewList.length > 0 && (
                  <div className="flex items-center gap-1 ml-1">
                    <Star className="size-3.5 text-amber-400" weight="fill" />
                    <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {reviewList.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet. Be the first to book and share your experience.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviewList.map((review) => (
                    <ReviewCard key={review.ID} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ServiceDetailDialog
        service={detailService}
        onClose={() => {
          setDetailService(null)
          setSelectedServiceId(null)
        }}
        slug={salon.slug}
      />
    </div>
  )
}

export default BusinessProfile


interface ServiceCardProps {
  service: ServiceResponse
  isSelected: boolean
  onSelect: (serviceId: string) => void
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  const durationInHours =
    service.duration_minutes >= 60
      ? `${(service.duration_minutes / 60).toFixed(1).replace(".0", "")} hrs`
      : `${service.duration_minutes} min`

  const price = (service.price_cents / 100).toFixed(2)

  return (
    <div
      onClick={() => onSelect(service.id)}
      className={cn(
        "group cursor-pointer rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.99]",
        isSelected
          ? "bg-primary shadow-[0_8px_24px_rgba(221,39,94,0.2)]"
          : "bg-surface-container-lowest shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="p-3">
        <div className="flex gap-3 items-center">
          <div
            className={cn(
              "p-1 rounded-xl ring-1 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isSelected ? "bg-white/15 ring-white/20" : "bg-black/[0.04] ring-black/5",
            )}
          >
            <div className="relative w-14 h-16 rounded-[0.6rem] overflow-hidden">
              <Image
                src={service.cover_image_url ?? "/salon-image-placeholder.jpg"}
                alt={service.name}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight truncate capitalize",
                  isSelected ? "text-white" : "text-foreground",
                )}
              >
                {service.name}
              </p>
              <span
                className={cn(
                  "text-sm font-bold shrink-0",
                  isSelected ? "text-white" : "text-primary",
                )}
              >
                R{price}
              </span>
            </div>
            <span
              className={cn(
                "text-xs",
                isSelected ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {durationInHours}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


function ServiceDetailDialog({
  service,
  onClose,
  slug,
}: {
  service: ServiceResponse | null
  onClose: () => void
  slug: string
}) {
  const router = useRouter()

  if (!service) return null

  const duration =
    service.duration_minutes >= 60
      ? `${(service.duration_minutes / 60).toFixed(1).replace(".0", "")} hours`
      : `${service.duration_minutes} min`
  const price = (service.price_cents / 100).toFixed(2)

  return (
    <Dialog
      open={!!service}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] sm:max-w-[440px]",
          "p-0 gap-0 rounded-[1.75rem] overflow-hidden border-0",
          "shadow-[0_32px_80px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)]",
          "max-h-[90dvh] overflow-y-auto",
        )}
      >
        <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-surface-container">
          <Image
            src={service.cover_image_url ?? "/salon-image-placeholder.jpg"}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="px-5 pt-4 pb-6 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
            {duration}
          </p>

          <DialogTitle className="text-2xl font-headline font-bold leading-tight -mt-1">
            {service.name}
          </DialogTitle>

          {service.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {service.description}
            </p>
          )}

          <div className="flex items-end justify-between pt-2 gap-4">
            <div>
              <p className="text-4xl font-black text-foreground leading-none">
                R{price}
              </p>
            </div>

            <Button
              className="group h-12 px-5 rounded-full flex items-center gap-2.5 shrink-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
              onClick={() => {
                router.push(`/explore/${slug}/services/${service.slug}/book`)
              }}
            >
              Book now
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 shrink-0">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// No reviewer name/avatar is available — reviews only carry a customer_id
// UUID and there's no public "get user by id" lookup endpoint.
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(review.CreatedAt), { addSuffix: true })}
        </p>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: review.Rating }).map((_, i) => (
            <Star key={i} className="size-3.5 text-amber-400" weight="fill" />
          ))}
        </div>
      </div>
      {review.Comment && (
        <p className="text-xs text-gray-500 leading-relaxed">{review.Comment}</p>
      )}
    </div>
  )
}
