"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Circle, Coins } from "@phosphor-icons/react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const proofPoints = ["10% fee on deposits only", "Capped at R30", "No subscriptions"]

function ForBusinessHero() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-6 py-16 md:py-20 grid grid-cols-12 gap-8 items-center">
      {/* Left column — text + CTA */}
      <div
        className={cn(
          "col-span-12 md:col-span-7 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}
      >
        <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-5">
          For business owners
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter leading-[0.95] mb-6">
          List free. No subscriptions.
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed mb-6 max-w-md">
          Appointments secured with a deposit, balance paid to you in person.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-semibold text-on-surface-variant">
          {proofPoints.map((point) => (
            <span key={point} className="flex items-center gap-2">
              <Circle className="size-1.5 text-primary" weight="fill" />
              {point}
            </span>
          ))}
        </div>
        <Link href="/onboarding">
          <Button className="group px-6 py-3 h-auto rounded-full text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]">
            List your business
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110">
              <ArrowUpRight className="size-3" />
            </span>
          </Button>
        </Link>
      </div>

      {/* Right column — visual proof */}
      <div
        className={cn(
          "col-span-12 md:col-span-5 relative mt-4 md:mt-0 transition-all duration-700 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
          <Image
            src="/salon-2.jpg"
            alt="Salon owner's workspace"
            fill
            className="object-cover"
          />
          {/* Opaque — no backdrop-blur on scrolling content (GPU perf) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full shadow-sm">
            <Coins className="size-4 text-primary" weight="fill" />
            <span className="text-xs font-semibold text-on-surface">R30 max fee, ever</span>
          </div>
        </div>
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-40 pointer-events-none -z-10" />
      </div>
    </section>
  )
}

export default ForBusinessHero
