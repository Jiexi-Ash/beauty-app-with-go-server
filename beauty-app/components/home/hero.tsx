"use client"
import { SealCheck, ArrowUpRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

function Hero() {
  const router = useRouter()
  const { ref, inView } = useInView({ threshold: 0.05 })

  return (
    <section
      ref={ref}
      className="max-w-[1440px] mx-auto px-6 py-28 md:py-36 grid grid-cols-12 gap-8 items-center"
      id="search"
    >
      {/* Left column — text + CTAs */}
      <div className="col-span-12 md:col-span-6">
        <h1
          className={cn(
            "text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-8 transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          Verified{" "}
          <span className="text-primary italic">Businesses,</span>{" "}
          <span>Transparent Pricing.</span>
        </h1>

        <p
          className={cn(
            "text-xl text-on-surface-variant max-w-lg leading-relaxed mb-10 transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          Every salon on our platform is vetted to ensure you get the service
          you deserve — with zero hidden fees and total price transparency.
        </p>

        <div
          className={cn(
            "flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          {/* Primary CTA — button-in-button trailing icon */}
          <Button
            size="lg"
            onClick={() => router.push("/onboarding")}
            className="group h-14 px-6 rounded-full flex items-center gap-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            Get your salon listed
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 shrink-0">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/explore?location=true")}
            className="text-primary border-outline-variant border-2 h-14 px-6 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            Find a salon near you
          </Button>
        </div>
      </div>

      {/* Right column — image bento */}
      <div
        className={cn(
          "col-span-12 md:col-span-6 relative mt-12 md:mt-0 transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[320px]">
              <Image
                src="/salon-1.jpg"
                alt="Modern salon interior"
                fill
                className="object-cover"
              />
              {/* Opaque — no backdrop-blur on scrolling content (GPU perf) */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full shadow-sm">
                <SealCheck className="size-4 text-primary" weight="fill" />
                <span className="text-xs font-semibold text-on-surface">Verified</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Double-bezel primary card */}
            <div className="p-1.5 rounded-[1.5rem] bg-primary/15 ring-1 ring-primary/20">
              <div className="bg-primary rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <p className="font-bold text-white text-base leading-tight">No hidden fees</p>
                <p className="text-white/75 text-xs leading-relaxed">
                  What you see is what you pay. We believe in fair, community-first pricing models.
                </p>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[220px]">
              <Image
                src="/salon-2.jpg"
                alt="Luxury hair salon"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-40 pointer-events-none" />
      </div>
    </section>
  )
}

export default Hero
