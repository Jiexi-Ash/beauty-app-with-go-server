"use client";

// Business settings page: status, description, hours, controls, address.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Check, PencilSimple, Rocket, X } from '@phosphor-icons/react'
import BookingControls from './booking-controls'
import BusinessHours from './business-hours'
import BusinessAddress from './business-address'
import { apiClient, ApiError } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'
import { toast } from 'sonner'
import type { OwnerSalon } from '@/lib/api-types'

function BusinessSettings() {
    const queryClient = useQueryClient()
    const { data: business, isLoading } = useQuery({
        queryKey: ["owner-salon"],
        queryFn: () => apiClient.get<OwnerSalon>("/owner/salon"),
    })
    const [isSaving, setIsSaving] = useState(false);

    const { mutate: toggleVisibility, isPending: isTogglingVisibility } = useMutation({
        mutationFn: () => apiClient.patch("/owner/salon/visibility"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["owner-salon"] });
            toast.success("Visibility updated");
        },
        onError: (error) => {
            toast.error(error instanceof ApiError ? error.message : "Could not update visibility.");
        },
    });

    const { mutate: publishSalon, isPending: isPublishing } = useMutation({
        mutationFn: () => apiClient.patch("/owner/salon/publish"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["owner-salon"] });
            toast.success("Your salon is published!");
        },
        onError: (error) => {
            toast.error(error instanceof ApiError ? error.message : "Could not publish your salon.");
        },
    });

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState(business?.Description ?? "");
    const [isSavingDescription, setIsSavingDescription] = useState(false);

    const startEditingDescription = () => {
        setDescription(business?.Description ?? "");
        setIsEditingDescription(true);
    };

    const cancelEditingDescription = () => {
        setIsEditingDescription(false);
    };

    const saveDescription = async () => {
        if (!business) return;
        setIsSaving(true);
        setIsSavingDescription(true);
        try {
            await apiClient.patch("/owner/salon", {
                name: business.Name,
                location: business.Location,
                description,
            });
            queryClient.invalidateQueries({ queryKey: ["owner-salon"] });
            toast.success("Business description updated");
            setIsEditingDescription(false);
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Could not update your business description.");
        } finally {
            setIsSaving(false);
            setIsSavingDescription(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px] space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        );
    }

    if (!business) return null;

    const isPublished = business.Status === "published";

    return (
        <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold md:text-3xl">Business Settings</h1>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Fine-tune your salon&apos;s operational flow, booking rules and visual brand identity to provide the best experience.
                    </p>
                </div>
            </div>

            <Card className="w-full pt-0 px-0 mt-6 lg:mt-10">
                <CardHeader className="relative h-40 w-full sm:h-64">
                    <Image src={business.CoverImageUrl ?? "/salon-image-placeholder.jpg"} alt="header" fill className="object-cover rounded-t-lg" />
                    <div className="absolute inset-0 bg-linear-to-t from-black z-10 via-transparent to-transparent"></div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="bg-muted rounded-lg p-6">
                            {isPublished ? (
                                <>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-bold text-primary uppercase tracking-tighter">Status</p>
                                        <Switch
                                            size="default"
                                            id="business-visibility"
                                            checked={business.Visibility === "visible"}
                                            disabled={isTogglingVisibility}
                                            onCheckedChange={() => toggleVisibility()}
                                        />
                                    </div>
                                    <p className="font-headline text-lg font-bold">
                                        {business.Visibility === "visible" ? "Public Profile Active" : "Profile Hidden"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {business.Visibility === "visible"
                                            ? "Visible to all clients on explore."
                                            : "Hidden from explore. Not accepting new bookings."}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-primary uppercase tracking-tighter mb-1">Status</p>
                                    <p className="font-headline text-lg font-bold">Not published yet</p>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Your salon won&apos;t appear on Explore or accept bookings until it&apos;s published.
                                        Make sure your address is set (needed for location) before publishing.
                                    </p>
                                    <Button
                                        size="sm"
                                        disabled={isPublishing}
                                        onClick={() => publishSalon()}
                                        className="rounded-full"
                                    >
                                        <Rocket className="size-4" />
                                        {isPublishing ? "Publishing..." : "Publish salon"}
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="bg-muted rounded-lg p-6">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Business Description</p>
                                {isEditingDescription ? (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={cancelEditingDescription}
                                            disabled={isSavingDescription}
                                        >
                                            <X className="size-4 text-primary" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={saveDescription}
                                            disabled={isSavingDescription || description.trim().length < 10}
                                        >
                                            <Check className="size-4 text-primary" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={startEditingDescription}
                                        disabled={isSaving}
                                    >
                                        <PencilSimple className="size-4 text-primary" />
                                    </Button>
                                )}
                            </div>
                            {isEditingDescription ? (
                                <div className="space-y-1">
                                    <Textarea
                                        autoFocus
                                        value={description}
                                        disabled={isSavingDescription}
                                        maxLength={250}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-background text-xs min-h-20 resize-none"
                                    />
                                    <p className="text-right text-[10px] tabular-nums text-muted-foreground">
                                        {description.length}/250 characters
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">{business.Description}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className='gap-4 w-full mt-6 grid grid-cols-1 lg:grid-cols-3'>
                <BusinessHours />
                <BookingControls />
            </div>

            <div className="mt-6">
                <BusinessAddress
                    name={business.Name}
                    location={business.Location}
                    isSaving={isSaving}
                    setIsSaving={setIsSaving}
                />
            </div>
        </div>
    )
}

export default BusinessSettings
