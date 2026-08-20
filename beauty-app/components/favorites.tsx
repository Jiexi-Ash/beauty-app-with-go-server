"use client";

import MainLayout from "./main-layout";
import Navbar from "./navbar";
import Footer from "./footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

type FavoriteSalon = {
  ID: string;
  Name: string;
  Slug: string;
  City: string | null;
  CoverImageUrl: string | null;
};

function Favorites() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiClient.get<FavoriteSalon[] | null>("/favorites"),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-tl-3xl rounded-br-3xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!favorites || favorites.length === 0) return <NoFavorites />;

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-bold text-2xl">My Favorites</h1>
          <p className="text-muted-foreground">
            Salons and spas you&apos;ve saved for later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((salon) => (
            <FavoriteCard key={salon.ID} salon={salon} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Favorites;

function FavoriteCard({ salon }: { salon: FavoriteSalon }) {
  const queryClient = useQueryClient();
  const { mutate: toggleFavorite, isPending } = useMutation({
    mutationFn: () => apiClient.post<{ favorited: boolean }>(`/favorites/${salon.Slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong.");
    },
  });

  return (
    <div className="group flex flex-col gap-3">
      <Link
        href={`/explore/${salon.Slug}`}
        className="relative block aspect-4/3 overflow-hidden rounded-tl-3xl rounded-br-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow duration-500 hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]"
      >
        <Image
          src={salon.CoverImageUrl ?? "/salon-image-placeholder.jpg"}
          fill
          alt={`${salon.Name} cover photo`}
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
        />

        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Remove from favorites"
          className="absolute top-3 right-3 rounded-full bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.96]"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite();
          }}
        >
          <Heart weight="fill" className="size-4 text-primary" />
        </Button>
      </Link>

      <div className="flex flex-col gap-1.5 px-1">
        <Link href={`/explore/${salon.Slug}`}>
          <h3 className="font-headline font-bold transition-colors duration-300 group-hover:text-primary">
            {salon.Name}
          </h3>
        </Link>
        {salon.City && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="text-xs">{salon.City}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NoFavorites() {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <Heart weight="fill" className="size-6 text-primary" />
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          Nothing <span className="text-primary">saved</span> yet.
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-10">
          Favorite the salons and spas you love so you can find them again
          fast.
        </p>

        <Card className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 w-full max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Discover top-rated salons in your area and tap the heart icon on
            any profile to save it here.
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
