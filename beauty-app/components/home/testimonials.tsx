"use client"
import Image from "next/image"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    quote: "Switching to The Beauty App was the best decision for my salon. It brought professional management to my business without the massive costs.",
    name: "Lerato Mokoena",
    role: "Owner, Lerato's Luxe Braids",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7yCAFBv55c3QbdD75z84DIns-TE78AcAVWU8zLCm0ncbR2_L0nC_Mvq55L4VpUUbwH0Wyi49H4zB1BWgyN2E_L_HOIcf2vGR2uz1COSUAnW7cMnaWZnPOkaK01QIq69nzKo9hs-kYJolW1ZWvY3hsWX-Si6hYxYHR68nsBBPXf6o42aAdexNn99a2LBEMBD2Tci2gq9wYzwtyXPgygKTIdyx0vjMm_rEcfkiJmpTb0-uDj7c3zkQ-M3pyNUOKwyHKSv65uwXkwhhU",
  },
  {
    quote: "Before this I was running everything on WhatsApp and a notebook. Now my clients book themselves, I get reminders, and I actually know my numbers.",
    name: "Sipho Ndlovu",
    role: "Owner, The Fade Factory Mamelodi",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAauPzPf1rOwH6AVnL2r8Bn3ZJ031zWbw_pDWTuxp2p16zR0WlEuK6DbgB9ZstQM-IV6n-6kmwISvNeH4Oza4UM_fX_D3I7FOtF-dpMBUnkS8cvj0y3nViMVVwzT9iSpSG-x_g7E8JDxazTURhTfB9X2OBbdO7NmloWkfsaqmY8diQ4c6MARpRw-vLhi3wFsWexuFGenB-EuC-jfVl0BnnL7cv0RGY0fcHpCNzuGZmf1PX92C4x0R9vpB3f-KP0pXNEDxdNak-GIz0h",
  },
  {
    quote: "The commission model on the free tier is honest — I started small and moved to Pro once I had the bookings to justify it. No pressure.",
    name: "Nomsa Dlamini",
    role: "Owner, Tips & Toes Lounge",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjo-mWxQ0qxMX1NqjoIYYaKI_4H4LWeHBUl0NnpUN_7xHFco0rQJzQuf8t-7w-w4-ARw34HhFatPL1o5j8INwXZWEGxZZkWZ-05eONqeM6QGeoQJuFmEvdTtRAbhNxrttfXVjVPP1xjHOM16LXi9wBBNqPEL4GACYWfQOa7UkEMAhom50RIRoWLsaAl7qf16Zd6uEk4DRAxs4feUNO6FqovOi5hXVdfUh1vunsnMcslZxst1rQZOJ_G-0wy78HrU3LaX7-N89taMO",
  },
]

function Testimonials() {
  const [lead, ...rest] = testimonials
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="bg-surface-container py-24 px-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div
          className={cn(
            "mb-14 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-4">
            — From the community —
          </div>
          <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">Real owners, real impact</h2>
          <p className="text-on-surface-variant">Not curated. Not filtered.</p>
        </div>

        {/* Asymmetric 7/5 layout — breaks the generic 3-equal-column pattern */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Lead testimonial — 7 cols, larger quote */}
          <div
            className={cn(
              "md:col-span-7 bg-surface-container-lowest rounded-2xl p-8 md:p-10 flex flex-col justify-between gap-8 transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              &ldquo;{lead.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              {/* Squircle avatar */}
              <div
                className="w-12 h-12 overflow-hidden relative shrink-0"
                style={{ borderRadius: "30%" }}
              >
                <Image src={lead.img} alt={lead.name} fill className="object-cover" />
              </div>
              <div>
                <p className="font-bold">{lead.name}</p>
                <p className="text-on-surface-variant text-sm">{lead.role}</p>
              </div>
            </div>
          </div>

          {/* Two stacked smaller testimonials — 5 cols */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {rest.map((t, i) => (
              <div
                key={t.name}
                className={cn(
                  "bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between gap-6 flex-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                )}
                style={{ transitionDelay: inView ? `${(i + 2) * 100}ms` : "0ms" }}
              >
                <p className="text-base font-medium leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  {/* Squircle avatar */}
                  <div
                    className="w-10 h-10 overflow-hidden relative shrink-0"
                    style={{ borderRadius: "30%" }}
                  >
                    <Image src={t.img} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-on-surface-variant text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/2 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  )
}

export default Testimonials
