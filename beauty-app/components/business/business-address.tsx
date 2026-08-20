"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MapPin, PencilSimple, X } from "@phosphor-icons/react";

interface BusinessAddressProps {
    name: string;
    location?: string;
    isSaving: boolean;
    setIsSaving: (value: boolean) => void;
}

type Suggestion = { description: string; placeId: string };
type PlacePrediction = { placeId: string; text: { text: string } };

export default function BusinessAddress({
    name,
    location,
    isSaving,
    setIsSaving,
}: BusinessAddressProps) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [currentLocation, setCurrentLocation] = useState(location);
    const [isPending, setIsPending] = useState(false);

    const handleSearch = useDebouncedCallback(async (value: string) => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const predictions = await apiClient.get<PlacePrediction[]>(
                `/places/autocomplete?input=${encodeURIComponent(value)}`,
            );
            setSuggestions(
                (predictions ?? []).map((p) => ({ description: p.text.text, placeId: p.placeId })),
            );
        } catch {
            setSuggestions([]);
        }
    }, 400);

    const handleSelect = async (suggestion: Suggestion) => {
        setIsPending(true);
        setIsSaving(true);
        try {
            await apiClient.patch("/owner/salon", {
                name,
                location: suggestion.description,
                place_id: suggestion.placeId,
            });
            setCurrentLocation(suggestion.description);
            queryClient.invalidateQueries({ queryKey: ["owner-salon"] });
            toast.success("Business address updated");
            closeEditor();
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Could not update the address.");
        } finally {
            setIsPending(false);
            setIsSaving(false);
        }
    };

    const closeEditor = () => {
        setIsEditing(false);
        setQuery("");
        setSuggestions([]);
    };

    if (isEditing) {
        return (
            <div className="bg-muted p-6 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">Business Address</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeEditor}
                        disabled={isPending}
                    >
                        <X className="size-4 text-primary" />
                    </Button>
                </div>
                <Input
                    autoFocus
                    value={query}
                    disabled={isPending}
                    placeholder="Search for your address..."
                    onChange={(e) => {
                        setQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    className="bg-background"
                />
                {suggestions.length > 0 && (
                    <ul className="rounded-lg border border-border bg-card">
                        {suggestions.map((s) => (
                            <li key={s.placeId}>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleSelect(s)}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                                >
                                    {s.description}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {isPending && (
                    <p className="text-xs text-muted-foreground">Saving address...</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-muted flex items-start justify-between p-6 rounded-xl">
            <div className="flex gap-3 items-start">
                <MapPin className="size-5 text-primary" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-primary">Business Address</p>
                    <p className="max-w-xs text-xs">{currentLocation}</p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
            >
                <PencilSimple className="size-4 text-primary" />
            </Button>
        </div>
    );
}
