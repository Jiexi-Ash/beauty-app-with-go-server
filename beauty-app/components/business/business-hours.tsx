"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BUSINESS_DAYS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Clock, FloppyDisk, PencilSimple } from "@phosphor-icons/react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Skeleton } from "../ui/skeleton";
import { pgTimeToHHMM, type SalonHour } from "@/lib/api-types";

// day_of_week matches Go's time.Weekday() (Sunday=0..Saturday=6), while
// BUSINESS_DAYS is ordered Monday-first for display.
const DAY_OF_WEEK: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

type DayState = {
  fullName: string;
  shortName: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

function toDayStates(hours: SalonHour[]): DayState[] {
  const byDayOfWeek = new Map(hours.map((h) => [h.DayOfWeek, h]));
  return BUSINESS_DAYS.map((d) => {
    const row = byDayOfWeek.get(DAY_OF_WEEK[d.fullName]);
    return {
      fullName: d.fullName,
      shortName: d.shortName,
      isClosed: row?.IsClosed ?? true,
      openTime: row ? pgTimeToHHMM(row.OpenTime, d.openTime) : d.openTime,
      closeTime: row ? pgTimeToHHMM(row.CloseTime, d.closeTime) : d.closeTime,
    };
  });
}

export default function BusinessHours() {
  const queryClient = useQueryClient();
  const { data: hours, isLoading } = useQuery({
    queryKey: ["owner-salon-hours"],
    queryFn: () => apiClient.get<SalonHour[]>("/owner/salon/hours"),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [days, setDays] = useState<DayState[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const savedDays = toDayStates(hours ?? []);

  const startEditing = () => {
    setDays(savedDays);
    setIsEditing(true);
  };

  const updateDay = (index: number, patch: Partial<DayState>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        days.map((day) =>
          apiClient.patch("/owner/salon/hours", {
            day_of_week: DAY_OF_WEEK[day.fullName],
            open_time: day.isClosed ? undefined : day.openTime,
            close_time: day.isClosed ? undefined : day.closeTime,
            is_closed: day.isClosed,
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["owner-salon-hours"] });
      toast.success("Business hours updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update business hours.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
                <Clock className="size-5 text-primary" />
              </div>
              <p className="font-headline text-lg font-bold">Business Hours</p>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <FloppyDisk className="size-4 text-primary-foreground ml-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="text-primary" onClick={startEditing} disabled={isLoading}>
                  <PencilSimple className="size-4 text-primary" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : isEditing ? (
          <div className="space-y-3">
            {days.map((day, index) => (
              <div key={day.fullName} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    size="default"
                    checked={!day.isClosed}
                    disabled={isSaving}
                    onCheckedChange={(open) => updateDay(index, { isClosed: !open })}
                  />
                  <span className="font-medium">{day.fullName}</span>
                </div>
                {day.isClosed ? (
                  <span className="text-sm text-muted-foreground">Closed</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={day.openTime}
                      disabled={isSaving}
                      onChange={(e) => updateDay(index, { openTime: e.target.value })}
                      className="h-8 w-24 sm:w-28 bg-background"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={day.closeTime}
                      disabled={isSaving}
                      onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                      className="h-8 w-24 sm:w-28 bg-background"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {savedDays.map((day) => (
              <div key={day.fullName} className="flex items-center justify-between">
                <span className="font-medium">{day.fullName}</span>
                {day.isClosed ? (
                  <Badge className="bg-muted text-muted-foreground">Closed</Badge>
                ) : (
                  <span className="text-muted-foreground">
                    {day.openTime} - {day.closeTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
