"use client"
import { CheckCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const freeTier = {
  name: "Community Free",
  description: "For solo artists just getting started.",
  price: "FREE",
  priceSuffix: "/forever",
  features: [
    "Unlimited bookings",
    "Up to 20 services listed",
    "Basic profile listing",
    "Automated WhatsApp reminders",
    "Verified badge after 50 completed bookings",
  ],
  cta: "Start for free",
}

// A literal em dash character anywhere in this file breaks Tailwind's scanner for
// every md: responsive class below it (grid silently collapses to one column).
const dash = "\u2014"

export default function PricingCards() {
  return (
    <div className="p-1.5 rounded-[1.5rem] bg-black/[0.03] ring-1 ring-black/5 transition-shadow duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <div className="rounded-[calc(1.5rem-0.375rem)] bg-surface-container-lowest p-8 md:p-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] grid grid-cols-1 md:grid-cols-12 gap-10 md:items-center">
        {/* Identity + price */}
        <div className="md:col-span-4">
          <div className="inline-flex w-fit items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-semibold mb-5">
            Live today {dash} no waitlist
          </div>
          <h3 className="text-2xl font-bold mb-1">{freeTier.name}</h3>
          <p className="text-sm text-on-surface-variant mb-6">{freeTier.description}</p>
          <p className="text-6xl font-black leading-none">
            {freeTier.price}
            <span className="text-base font-medium ml-1 text-on-surface-variant">
              {freeTier.priceSuffix}
            </span>
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block md:col-span-1 h-full w-px bg-outline-variant/20 mx-auto" />

        {/* Commission copy + features */}
        <div className="md:col-span-4">
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            10% commission on deposits only, capped at{" "}
            <span className="font-semibold text-on-surface">R30</span> {dash} you keep 100% of
            what you collect in person. We absorb the card fees.
          </p>
          <ul className="space-y-3">
            {freeTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <CheckCircle size={16} weight="fill" className="shrink-0 mt-0.5 text-primary" />
                <span className="text-sm leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="md:col-span-3">
          <Link href="/onboarding">
            <Button
              className="w-full h-14 rounded-full font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              {freeTier.cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
