"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import BusinessDetailForm from "@/components/onboarding/business-details-form";

function Onboarding() {
  return (
    <div className="w-full min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="h-16 flex items-center bg-white w-full sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto flex px-6 lg:px-8 2xl:px-0">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="size-6 text-muted-foreground" />
            <div className="text-xl font-bold">
              The <span className="text-primary">Beauty</span> App
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full">
        <div className="container mx-auto px-6 lg:px-8 2xl:px-0 pt-6 pb-24">
          <div className="mb-8 max-w-xl">
            <h1 className="text-2xl md:text-3xl font-bold">Set up your salon</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Tell clients who you are and where to find you.
            </p>
          </div>

          <BusinessDetailForm />
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
