import { Skeleton } from "@/components/ui/skeleton"
import MainLayout from "@/components/main-layout"

export function BookingPageSkeleton() {
  return (
    <MainLayout>
      <div className="mt-10">
        {/* Back link */}
        <Skeleton className="h-4 w-40 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">
          {/* ── Left column ── */}
          <div className="space-y-10">
            {/* Heading */}
            <div>
              <Skeleton className="h-12 w-80 lg:w-96" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>

            {/* Date & Time section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-28 mt-1" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="size-9 rounded-full" />
                </div>
              </div>

              {/* Date cards */}
              <div className="flex gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-18 h-22 lg:flex-1 lg:w-auto lg:h-24 rounded-2xl shrink-0"
                  />
                ))}
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* Form section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-36" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-25 w-full rounded-md" />
              </div>
            </div>

            {/* Mobile confirm card */}
            <div className="lg:hidden">
              <ConfirmBookingSkeleton />
            </div>
          </div>

          {/* ── Right column (desktop) ── */}
          <div className="hidden lg:block sticky top-8">
            <ConfirmBookingSkeleton />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function ConfirmBookingSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-black/5 overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full h-48 rounded-none" />

      <div className="p-5 space-y-4">
        {/* Badge + business name */}
        <div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-40 mt-2" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>

        {/* Service details */}
        <div className="border-t border-foreground/8 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20 mt-1" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Deposit line */}
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>

        {/* Due today */}
        <div className="flex justify-between pt-3 border-t border-foreground/8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full rounded-full" />

        {/* Secure payment text */}
        <Skeleton className="h-3 w-36 mx-auto" />
      </div>
    </div>
  )
}
