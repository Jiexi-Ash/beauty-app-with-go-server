"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import {
  Broadcast,
  CalendarDots,
  GearSix,
  type Icon,
  Scissors,
  SignOut,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import type { OwnerSalon } from "@/lib/api-types";

const navlinks = [
  { href: "/dashboard", label: "overview", icon: SquaresFour },
  { href: "/dashboard/appointments", label: "appointments", icon: CalendarDots },
  { href: "/dashboard/services", label: "services", icon: Scissors },
  { href: "/dashboard/clients", label: "clients", icon: UsersThree },
  { href: "/dashboard/settings", label: "settings", icon: GearSix },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { data: salon } = useQuery({
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
    <Sidebar className="border-border/60">
      <SidebarHeader>
        <SidebarMenu className="pl-2 py-3">
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-0.5 text-xl font-bold tracking-tight select-none px-2"
            >
              <span className="text-foreground">The</span>
              <span className="text-primary">Beauty</span>
              <span className="text-foreground">App</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-3 gap-1">
          {navlinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <MenuItem
                key={link.label}
                Icon={link.icon}
                href={link.href}
                label={link.label}
                isActive={isActive}
              />
            );
          })}
        </SidebarMenu>

        {salon && salon.Status !== "published" && (
          <div className="px-3 mt-2">
            <Link
              href="/dashboard/settings"
              className="flex w-full items-center gap-2.5 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 cursor-pointer"
            >
              <Broadcast className="size-5" weight="fill" />
              Finish setup
            </Link>
            <p className="px-3 pt-1.5 text-xs text-muted-foreground">
              Publish your salon to appear on Explore.
            </p>
          </div>
        )}

        {salon && salon.Status === "published" && salon.Visibility === "hidden" && (
          <div className="px-3 mt-2">
            <button
              type="button"
              onClick={() => goLive()}
              disabled={isGoingLive}
              className="flex w-full items-center gap-2.5 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              <Broadcast className="size-5" weight="fill" />
              {isGoingLive ? "Going live…" : "Go Live"}
            </button>
            <p className="px-3 pt-1.5 text-xs text-muted-foreground">
              You&apos;re not visible to clients yet.
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2.5 rounded-xl p-2">
            <Link
              href="/dashboard/settings"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user?.email ?? "")}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium text-foreground">
                {user?.email ?? "Your account"}
              </span>
            </Link>
            <button
              aria-label="Sign out"
              onClick={handleSignOut}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <SignOut className="size-4" />
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default DashboardSidebar;

const MenuItem = ({
  label,
  Icon: LinkIcon,
  href,
  isActive,
}: {
  label: string;
  href: string;
  Icon: Icon;
  isActive: boolean;
}) => {
  return (
    <SidebarMenuItem key={label}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors duration-200 text-sm",
          isActive
            ? "bg-primary/8 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <LinkIcon className="size-5" weight={isActive ? "fill" : "regular"} />
        <span className="capitalize">{label}</span>
      </Link>
    </SidebarMenuItem>
  );
};
