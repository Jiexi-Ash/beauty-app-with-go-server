"use client"
import Image from "next/image"
import { ArrowRight, MapPin } from "@phosphor-icons/react"
import Link from "next/link"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

type Salon = {
  id: string
  name: string
  city: string | null
  slug: string
  cover_image_url: string | null
}

interface PopularSalonsProps {
  salons: Salon[]
}

function PopularSalons({ salons }: PopularSalonsProps) {
  const { ref, inView } = useInView()

  if (salons.length === 0) return null

  const [lead, ...rest] = salons

  return (
    <section ref={ref} className="py-24 px-6 max-w-7xl mx-auto">
      <div
        className={cn(
          "flex items-end justify-between mb-14 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}
      >
        <div>
          <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">
            Local gems
          </h2>
          <p className="text-on-surface-variant">Salons to check out near you.</p>
        </div>
        <Link
          className="text-xs text-primary font-bold flex items-center gap-1.5 hover:underline underline-offset-4 shrink-0 transition-colors duration-200"
          href="/explore"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className={cn("grid grid-cols-1 gap-5", rest.length > 0 && "md:grid-cols-12")}>
        {/* Lead card */}
        <div
          className={cn(
            "group transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
            rest.length > 0 ? "md:col-span-7" : "md:col-span-12",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <SalonCard salon={lead} imageHeight="h-[520px]" size="lead" />
        </div>

        {/* Stacked cards */}
        {rest.length > 0 && (
          <div className="md:col-span-5 flex flex-col gap-5">
            {rest.map((salon, i) => (
              <div
                key={salon.id}
                className={cn(
                  "group flex-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                )}
                style={{ transitionDelay: inView ? `${(i + 2) * 100}ms` : "0ms" }}
              >
                <SalonCard salon={salon} imageHeight="h-[240px]" size="compact" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PopularSalons

function SalonCard({
  salon,
  imageHeight,
  size,
}: {
  salon: Salon
  imageHeight: string
  size: "lead" | "compact"
}) {
  const isLead = size === "lead"

  return (
    <Link href={`/explore/${salon.slug}`} className="block">
      <div
        className={cn(
          "relative overflow-hidden transition-shadow duration-500",
          imageHeight,
          isLead
            ? "rounded-tl-3xl rounded-br-3xl rounded-tr-xl rounded-bl-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
            : "rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]",
        )}
      >
        <Image
          src={salon.cover_image_url ?? "/salon-image-placeholder.jpg"}
          alt={salon.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Bottom scrim for overlaid text */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 via-35% to-transparent pointer-events-none",
            isLead ? "h-[45%]" : "h-[55%]",
          )}
        />

        {/* Name, city — overlaid on the scrim */}
        <div className={cn("absolute flex items-end justify-between gap-3", isLead ? "bottom-4 left-4 right-4" : "bottom-3 left-3 right-3")}>
          <div>
            <h3
              className={cn(
                "font-headline font-bold text-white group-hover:text-primary transition-colors duration-300",
                isLead ? "text-xl" : "text-base",
              )}
            >
              {salon.name}
            </h3>
            {salon.city && (
              <p className={cn("text-white/80 flex items-center gap-1", isLead ? "text-sm" : "text-xs")}>
                <MapPin className="size-3 shrink-0" />
                {salon.city}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
