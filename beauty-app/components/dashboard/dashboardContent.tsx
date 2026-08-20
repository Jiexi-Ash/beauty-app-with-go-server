"use client";

import AnalyticCards from "./analytics-cards";
import Revenue from "./revenue";
import UpcomingBookings from "./upcoming-bookings";
import ServiceHighlight from "./service-highlight";

function DashboardContent() {
  return (
    <div className="w-full">
      <div className="w-full 2xl:max-w-[1600px] 2xl:mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center px-6 py-4">
        <div className="flex flex-col gap-3 lg:gap-0 lg:items-center lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-xl md:text-2xl">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              {"Here's what's been happening lately."}
            </p>
          </div>

        </div>
      </div>
      <div className="w-full px-6 pt-2 pb-6 space-y-4 lg:space-y-4">
        <AnalyticCards />
        <UpcomingBookings />
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:h-[450px]">
          <Revenue />
          <ServiceHighlight />
        </div>
      </div>
      </div>
    </div>
  );
}

export default DashboardContent;
