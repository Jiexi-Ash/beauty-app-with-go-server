"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatZarFromRands } from "@/lib/utils";
import type { OwnerBooking, OwnerService } from "@/lib/api-types";

type Period = "week" | "month" | "year";

const PERIOD_DESCRIPTION: Record<Period, string> = {
  week: "The last 7 days",
  month: "This month's weekly performance",
  year: "This year's monthly performance",
};

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
} satisfies ChartConfig;

function buildChartData(
  period: Period,
  bookings: OwnerBooking[],
  serviceMap: Map<string, OwnerService>,
) {
  const now = new Date();
  const completed = bookings.filter((b) => b.status === "completed");
  const revenueOf = (b: OwnerBooking) => (serviceMap.get(b.service_id)?.PriceCents ?? 0) / 100;

  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      const revenue = completed
        .filter((b) => new Date(b.start_time).toDateString() === day.toDateString())
        .reduce((sum, b) => sum + revenueOf(b), 0);
      return { label: day.toLocaleDateString(undefined, { weekday: "short" }), revenue };
    });
  }

  if (period === "year") {
    return Array.from({ length: 12 }, (_, i) => {
      const revenue = completed
        .filter((b) => {
          const d = new Date(b.start_time);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === i;
        })
        .reduce((sum, b) => sum + revenueOf(b), 0);
      const label = new Date(now.getFullYear(), i, 1).toLocaleDateString(undefined, { month: "short" });
      return { label, revenue };
    });
  }

  // month: bucket by week-of-month
  const weeksInMonth = Math.ceil(
    (new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() + now.getDay()) / 7,
  );
  return Array.from({ length: weeksInMonth }, (_, i) => {
    const weekStart = i * 7 + 1;
    const weekEnd = Math.min(weekStart + 6, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    const revenue = completed
      .filter((b) => {
        const d = new Date(b.start_time);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() >= weekStart &&
          d.getDate() <= weekEnd
        );
      })
      .reduce((sum, b) => sum + revenueOf(b), 0);
    return { label: `Week ${i + 1}`, revenue };
  });
}

function Revenue() {
  const [selectedPeriod, setPeriod] = useState<Period>("month");

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: () => apiClient.get<OwnerBooking[] | null>("/owner/bookings"),
  });
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["owner-services"],
    queryFn: () => apiClient.get<OwnerService[] | null>("/owner/services"),
  });

  const isLoading = bookingsLoading || servicesLoading;
  const serviceMap = new Map((services ?? []).map((s) => [s.ID, s]));
  const chartData = isLoading ? [] : buildChartData(selectedPeriod, bookings ?? [], serviceMap);

  return (
    <div className="flex-1 h-full">
      <Card className="h-full">
        <CardHeader>
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Processed Revenue</CardTitle>
              <CardDescription>
                {PERIOD_DESCRIPTION[selectedPeriod]}
              </CardDescription>
            </div>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setPeriod(value as Period)}
            >
              <SelectTrigger className="bg-muted capitalize">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectGroup>
                  <SelectItem className="capitalize" value="week">
                    Week
                  </SelectItem>
                  <SelectItem className="capitalize" value="month">
                    Month
                  </SelectItem>
                  <SelectItem className="capitalize" value="year">
                    Year
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4">
          {isLoading ? (
            <Skeleton className="h-full w-full min-h-[200px]" />
          ) : chartData.every((d) => d.revenue === 0) ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No revenue for this period yet.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-full w-full min-h-[260px]"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 24 }}
              >
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) =>
                    selectedPeriod === "month" ? value : value.slice(0, 3)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      cursor={false}
                      formatter={(value) => formatZarFromRands(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--primary)"
                  radius={10}
                  background={{ fill: "var(--muted)", radius: 10 }}
                >
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    offset={8}
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(value) =>
                      typeof value === "number" && value > 0
                        ? formatZarFromRands(value)
                        : ""
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Revenue;
