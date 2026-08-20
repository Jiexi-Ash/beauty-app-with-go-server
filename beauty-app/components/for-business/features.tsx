"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CalendarDots, UsersThree, ArrowUpRight } from "@phosphor-icons/react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

function Features() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="bg-surface-container-low py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div
          className={cn(
            "mb-16 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">
            Built for your hustle
          </h2>
          <p className="text-on-surface-variant">Professional tools, community-centric pricing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Seamless Booking */}
          <div
            className={cn(
              "md:col-span-2 bg-surface-container-lowest p-10 rounded-2xl flex flex-col justify-between transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <div>
              {/* Double-bezel icon container */}
              <div className="w-14 h-14 p-1 rounded-full bg-primary/10 ring-1 ring-primary/15 mb-8">
                <div className="w-full h-full rounded-full bg-secondary-container-ds flex items-center justify-center text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <CalendarDots size={22} weight="duotone" />
                </div>
              </div>
              <h3 className="text-3xl font-headline font-bold mb-4">Appointments that run themselves</h3>
              <p className="text-on-surface-variant max-w-md text-lg">
                Automated scheduling, reminders, and cancellations that keep your chairs full — no manual logs, no missed appointments.
              </p>
            </div>
            <div className="mt-12 flex gap-4">
              <span className="bg-surface-container-low px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
                Real-time sync
              </span>
              <span className="bg-surface-container-low px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
                WhatsApp reminders
              </span>
            </div>
          </div>

          {/* Only pay when you get paid */}
          <div
            className={cn(
              "bg-gradient-to-br from-primary to-primary-container p-10 rounded-2xl text-white flex flex-col justify-center transition-all duration-700 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-headline font-bold mb-4">Only pay when you get paid</h3>
              <p className="opacity-90 leading-relaxed">
                No subscription, no upfront cost. We take a small cut of the deposit — capped, so a big booking never costs you more.
              </p>
            </div>
            <p className="text-4xl font-black mb-2">R30 max fee</p>
            <p className="text-xs uppercase tracking-widest opacity-70">10% of deposit, capped. You keep 100% collected in person.</p>
          </div>

          {/* Customer Records */}
          <div
            className={cn(
              "bg-surface-container-lowest p-10 rounded-2xl transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            {/* Double-bezel icon container */}
            <div className="w-14 h-14 p-1 rounded-full bg-primary/10 ring-1 ring-primary/15 mb-8">
              <div className="w-full h-full rounded-full bg-secondary-container-ds flex items-center justify-center text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <UsersThree size={22} weight="duotone" />
              </div>
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4">Customer records</h3>
            <p className="text-on-surface-variant">
              Store preferences, allergy alerts, and visit history to provide that personalised service every single time.
            </p>
          </div>

          {/* CTA */}
          <div
            className={cn(
              "md:col-span-2 bg-gradient-to-br from-primary to-primary-container p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700 delay-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <div>
              <h3 className="text-2xl font-headline font-bold text-white mb-2">
                Your salon deserves better tools.
              </h3>
              <p className="text-white/80 text-sm">Get listed and start taking bookings in under 10 minutes.</p>
            </div>
            <Link href="/onboarding" className="shrink-0">
              <Button className="group bg-white text-primary hover:bg-white/90 font-bold px-6 py-3 h-auto rounded-full text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]">
                List your salon
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110">
                  <ArrowUpRight className="size-3 text-primary" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
