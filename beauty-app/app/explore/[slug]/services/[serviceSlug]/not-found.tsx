"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { CaretLeft, Compass } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";

function ServiceNotFound() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="w-full min-h-screen relative">
      <Navbar />

      {/* Shared background treatment */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/salon-image-placeholder.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        {/* Hero text */}
        <h1 className="text-5xl font-bold text-gray-900 text-center mb-3">
          Service not found.
        </h1>
        <p className="text-gray-600 text-center max-w-sm mb-10">
          This service may no longer be available or the link may be incorrect.
        </p>

        {/* Card */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/60">
          <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
            Head back to the salon profile to browse available services, or
            explore other salons near you.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {slug && (
              <Button
                className="flex-1 h-10 rounded-full font-semibold py-3 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Link href={`/explore/${slug}`} className="flex items-center gap-2">
                  <CaretLeft className="size-4" />
                  Back to Salon
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 rounded-full font-semibold py-3 border-2 border-primary text-primary hover:bg-primary/5"
              size="lg"
            >
              <Link href="/explore" className="flex items-center gap-2">
                <Compass className="size-4" />
                Explore Salons
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default ServiceNotFound;