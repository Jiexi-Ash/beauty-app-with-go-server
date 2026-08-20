import { Skeleton } from '@/components/ui/skeleton'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

export function BookingConfirmationSkeleton() {
    return (
        <div className="w-full min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center px-4 py-16">
                {/* Check icon */}
                <Skeleton className="w-16 h-16 rounded-full mb-6" />

                {/* Heading */}
                <Skeleton className="h-10 w-72 mb-3" />

                {/* Subtext */}
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-48 mb-10" />

                {/* Booking details card */}
                <div className="w-full max-w-3xl mb-4">
                    <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5">

                        {/* Status + amount */}
                        <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <div className="flex flex-col items-end gap-1">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>

                        {/* Service name */}
                        <Skeleton className="h-7 w-3/4 mb-2" />
                        <Skeleton className="h-7 w-1/2 mb-5" />

                        {/* Date & Time */}
                        <div className="flex gap-8 mb-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-3 w-8" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-3 w-8" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-black/5 mb-5" />

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Skeleton className="flex-1 h-12 rounded-full" />
                            <Skeleton className="flex-1 h-12 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Location card */}
                <div className="w-full max-w-3xl bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden">
                    <Skeleton className="w-full h-48 md:h-56 rounded-none" />
                    <div className="p-6">
                        <Skeleton className="h-6 w-40 mb-3" />
                        <div className="flex items-center gap-1">
                            <Skeleton className="w-4 h-4 rounded shrink-0" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-14 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}