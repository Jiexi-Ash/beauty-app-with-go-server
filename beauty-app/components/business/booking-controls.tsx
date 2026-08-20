"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "../ui/input";
import { FloppyDisk, PencilSimple, SlidersHorizontal } from "@phosphor-icons/react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Skeleton } from "../ui/skeleton";
import type { SalonSettings } from "@/lib/api-types";

export default function BookingControls() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["owner-salon-settings"],
    queryFn: () => apiClient.get<SalonSettings>("/owner/salon/settings"),
  });

  const savedMaxConcurrent = settings?.MaxConcurrentBookings ?? 2;
  const savedBufferMinutes = settings?.BufferAfterServiceMinutes ?? 0;
  const savedAllowBeyondClose = settings?.AllowBookingBeyondCloseTime ?? false;

  const [isEditing, setIsEditing] = useState(false);
  const [maxConcurrent, setMaxConcurrent] = useState(savedMaxConcurrent);
  const [bufferMinutes, setBufferMinutes] = useState(savedBufferMinutes);
  const [allowBeyondClose, setAllowBeyondClose] = useState(savedAllowBeyondClose);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setMaxConcurrent(savedMaxConcurrent);
    setBufferMinutes(savedBufferMinutes);
    setAllowBeyondClose(savedAllowBeyondClose);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch("/owner/salon/settings", {
        buffer_after_service_minutes: bufferMinutes,
        max_concurrent_bookings: maxConcurrent,
        allow_booking_beyond_close_time: allowBeyondClose,
      });
      queryClient.invalidateQueries({ queryKey: ["owner-salon-settings"] });
      toast.success("Booking controls updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
                <SlidersHorizontal className="size-5 text-primary" />
              </div>
              <p className="font-headline text-lg font-bold">Booking Controls</p>
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
      <CardContent className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
              concurrent limits
            </span>
            <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
              <span className="text-foreground font-bold">Max Clients/Slot</span>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  max={2}
                  value={maxConcurrent}
                  disabled={isSaving}
                  onChange={(e) => setMaxConcurrent(Math.min(2, Math.max(1, Number(e.target.value) || 1)))}
                  className="h-9 w-16 border-0 bg-background text-right text-lg font-extrabold text-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                />
              ) : (
                <span className="text-2xl font-headline font-extrabold text-primary">
                  {String(savedMaxConcurrent).padStart(2, "0")}
                </span>
              )}
            </div>
            <p className="max-w-xs text-xs">
              Maximum number of concurrent bookings per slot (up to 2)
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
              Grace Period Buffer
            </span>
            <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
              <span className="text-foreground font-bold">Post Service</span>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={bufferMinutes}
                    disabled={isSaving}
                    onChange={(e) => setBufferMinutes(Math.max(0, Number(e.target.value) || 0))}
                    className="h-9 w-16 border-0 bg-background text-right text-lg font-extrabold text-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                  <span className="text-muted-foreground text-sm">min</span>
                </div>
              ) : (
                <span className="text-2xl font-headline font-extrabold text-primary">
                  <span className="text-primary font-bold mr-1">{savedBufferMinutes}</span>
                  <span className="text-muted-foreground text-sm">min</span>
                </span>
              )}
            </div>
            <p className="max-w-xs text-xs">
              Downtime between bookings for breaks and/or cleaning.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
              Booking Beyond Closing Time
            </span>
            <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
              <span className="text-foreground font-bold">
                {(isEditing ? allowBeyondClose : savedAllowBeyondClose) ? "Allowed" : "Not Allowed"}
              </span>
              <Switch
                size="default"
                checked={isEditing ? allowBeyondClose : savedAllowBeyondClose}
                disabled={!isEditing || isSaving}
                onCheckedChange={setAllowBeyondClose}
              />
            </div>
            <p className="max-w-xs text-xs">
              Allow appoitments that stretch beyond your business close time.
            </p>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
