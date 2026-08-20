"use client"
import { useState } from 'react'
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ArrowRight, MapPin, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Category filtering has no backend yet — salon_tags exist in the DB but
// CreateSalon never assigns them, so these pills are inert until then.
const CATEGORIES = ["All", "Hair Styling", "Nails", "Barbershop", "Massage", "Lashes", "Makeup", "Luxury Spa", "Skincare"]

type Salon = {
    id: string
    name: string
    city: string | null
    slug: string
    cover_image_url: string | null
}

function Explore() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const search = searchParams.get("search")
    const city = searchParams.get("city")
    const [searchValue, setSearchValue] = useState(search ?? "")
    const [cityValue, setCityValue] = useState(city ?? "")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [focusedField, setFocusedField] = useState<"search" | "city" | null>(null)

    const { data: salons, isLoading } = useQuery({
        queryKey: ["salons"],
        queryFn: () => apiClient.get<Salon[] | null>("/salons"),
    })

    const handleSearch = () => {
        if (!searchValue.trim() && !cityValue.trim()) return
        if (searchValue.trim().length > 0 && searchValue.trim().length < 2) return

        const params = new URLSearchParams(searchParams.toString())

        if (searchValue.trim()) params.set("search", searchValue.trim())
        else params.delete("search")

        if (cityValue.trim()) params.set("city", cityValue.trim())
        else params.delete("city")

        router.push(`/explore?${params.toString()}`)
    }

    const handleSelectCategory = (category: string) => {
        setSelectedCategory(category)
        if (category !== "All") {
            toast.info("Category filtering isn't wired up yet — showing all salons.")
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 mt-10">
                <div className="space-y-1">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                        Find a <span className="text-primary italic">Salon.</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">Discover top-rated salons and spas near you</p>
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-3">
                            <div className="aspect-4/3 rounded-tl-4xl rounded-br-4xl bg-gray-100 animate-pulse" />
                            <div className="flex flex-col gap-2 px-1">
                                <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const searchLower = search?.trim().toLowerCase()
    const cityLower = city?.trim().toLowerCase()

    const filteredBusinesses = (salons ?? []).filter((salon) => {
        if (searchLower && !salon.name.toLowerCase().includes(searchLower)) return false
        if (cityLower && !salon.city?.toLowerCase().includes(cityLower)) return false
        return true
    })

    return (
        <div className="space-y-6 mt-10">
            <div className="space-y-1">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    Find a <span className="text-primary italic">Salon.</span>
                </h1>
                <p className="text-sm text-muted-foreground">Discover top-rated salons and spas near you</p>
            </div>

            <div className={cn(
                "flex items-center w-full max-w-2xl rounded-full border transition-all duration-200 overflow-hidden",
                focusedField ? "bg-white ring-2 ring-primary border-primary" : "border-gray-300 bg-gray-50"
            )}>
                <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                    <MagnifyingGlass className="size-4 text-gray-400 shrink-0" />
                    <Input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Salon name..."
                        className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                        onFocus={() => setFocusedField("search")}
                        onBlur={() => setFocusedField(null)}
                    />
                </div>
                <div className="w-px h-6 bg-gray-200 shrink-0" />
                <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                    <MapPin className="size-4 text-gray-400 shrink-0" />
                    <Input
                        value={cityValue}
                        onChange={(e) => setCityValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="City..."
                        className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => setFocusedField(null)}
                    />
                </div>
                <div className="pr-1.5">
                    <Button onClick={handleSearch} size="lg" className="rounded-lg cursor-pointer shrink-0 px-6">
                        Find
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {CATEGORIES.map((category) => (
                    <Button
                        key={category}
                        onClick={() => handleSelectCategory(category)}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        className={cn(
                            "px-4 py-1.5 rounded-sm text-sm font-medium border transition-all duration-200 cursor-pointer",
                            selectedCategory === category
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                        )}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Results area */}
            {filteredBusinesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full">
                        <MagnifyingGlass className="size-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">No results found</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            We could not find any salons matching your search. Try adjusting your filters or search for something else.
                        </p>
                    </div>
                    <Button size="lg" className="rounded-sm px-6 mt-2" onClick={() => {
                        setSearchValue("")
                        setCityValue("")
                        router.push("/explore")
                    }}>
                        Clear Search
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredBusinesses.map((salon) => (
                        <Link key={salon.id} href={`/explore/${salon.slug}`} className="group flex flex-col gap-3">
                            <div className="relative aspect-4/3 overflow-hidden">
                                <Image
                                    src={salon.cover_image_url ?? "/salon-image-placeholder.jpg"}
                                    fill
                                    alt={`${salon.name} cover photo`}
                                    className="object-cover rounded-tl-4xl rounded-br-4xl group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex flex-col gap-1 px-1">
                                <h2 className="text-sm font-semibold leading-tight group-hover:text-primary">{salon.name}</h2>
                                {salon.city && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <MapPin className="size-3.5 shrink-0" />
                                        <p className="text-xs">{salon.city}</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="secondary"
                                size="lg"
                                tabIndex={-1}
                                className="mx-1 text-xs group-hover:bg-primary group-hover:text-white transition-all duration-200 ease-in-out w-full pointer-events-none"
                            >
                                View Details
                                <ArrowRight className="size-3" />
                            </Button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Explore
