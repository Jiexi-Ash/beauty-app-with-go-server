"use client";

import { Broadcast, SignOut } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "./notification-bell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OwnerSalon } from "@/lib/api-types";

function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: salon, isLoading } = useQuery({
    queryKey: ["owner-salon"],
    queryFn: () => apiClient.get<OwnerSalon>("/owner/salon"),
    retry: false,
  });

  const { mutate: goLive, isPending: isGoingLive } = useMutation({
    mutationFn: () => apiClient.patch("/owner/salon/visibility"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-salon"] });
      toast.success("You're live!", { description: "Clients can now find and book your salon." });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not go live. Try again.");
    },
  });

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="top-0 sticky border-b border-border shadow-sm px-4 md:px-6 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex w-full justify-between items-center 2xl:max-w-[1600px] 2xl:mx-auto">
        <div className="flex gap-3 items-center h-20">
          {isLoading ? (
            <>
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : salon ? (
            <>
              <div className="relative w-12 h-12 rounded-full">
                <Image
                  src={salon.CoverImageUrl ?? "/salon-image-placeholder.jpg"}
                  alt={`${salon.Name} cover image`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h1 className="text-base text-foreground font-bold">{salon.Name}</h1>
            </>
          ) : null}
        </div>

        <div className="flex gap-2 items-center">
          {salon && salon.Status !== "published" && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 cursor-pointer lg:hidden"
            >
              <Broadcast className="size-3.5" weight="fill" />
              Finish setup
            </Link>
          )}
          {salon && salon.Status === "published" && salon.Visibility === "hidden" && (
            <button
              type="button"
              onClick={() => goLive()}
              disabled={isGoingLive}
              aria-label="Go live"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer lg:hidden"
            >
              <Broadcast className="size-3.5" weight="fill" />
              {isGoingLive ? "Going live…" : "Go Live"}
            </button>
          )}

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="flex size-9 items-center justify-center rounded-full transition-colors duration-200 hover:ring-2 hover:ring-muted cursor-pointer lg:hidden"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user?.email ?? "")}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">
                  {user?.email ?? "Your account"}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <SignOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
