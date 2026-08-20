"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { Card } from "../ui/card";

function NoBookings() {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <Sparkle weight="fill" className="size-6 text-primary" />
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          Your next <span className="text-primary">style</span> is waiting.
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-10">
          {"You haven't made any appointments yet. Explore salons near you and book one today."}
        </p>

        <Card className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 w-full max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Discover top-rated salons in your area, browse services, and book
            in minutes.
          </p>
          <Button
            className="group w-full rounded-full font-semibold py-3 bg-primary hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            size="lg"
          >
            <Link href="/explore" className="flex items-center justify-center gap-1.5 w-full">
              Browse Salons
              <span className="flex items-center justify-center size-6 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="size-3.5 text-white" />
              </span>
            </Link>
          </Button>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

export default NoBookings;