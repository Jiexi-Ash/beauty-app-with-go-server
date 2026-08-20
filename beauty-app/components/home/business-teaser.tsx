"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowUpRight, Circle } from "@phosphor-icons/react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const proofPoints = ["10% fee on deposits only", "Capped at R30"]

function BusinessTeaser() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-6 py-16">
      <div
        className={cn(
          "bg-gradient-to-br from-primary to-primary-container rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}
      >
        <div className="max-w-xl">
          <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-3">
            For business owners
          </p>
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-3">List free. No subscriptions.</h2>
          <p className="text-primary-foreground/85 text-lg leading-relaxed">
            Appointments secured with a deposit, balance paid to you in person.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm font-semibold text-primary-foreground/90">
            {proofPoints.map((point) => (
              <span key={point} className="flex items-center gap-2">
                <Circle className="size-1.5 text-primary-foreground/70" weight="fill" />
                {point}
              </span>
            ))}
          </div>
        </div>
        <Link href="/for-business" className="shrink-0">
          <Button className="group bg-white text-primary hover:bg-white/90 font-bold px-6 py-3 h-auto rounded-full text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]">
            List your business
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110">
              <ArrowUpRight className="size-3 text-primary" />
            </span>
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default BusinessTeaser
