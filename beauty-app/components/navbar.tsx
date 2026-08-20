"use client";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  House,
  Compass,
  Heart,
  CalendarDots,
  GearSix,
  UserCircle,
  Storefront,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useState, useEffect } from "react";

function Navbar() {
  const { user, isSignedIn, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const mobileNavItems = [
    { href: "/", label: "Home", icon: House },
    { href: "/explore", label: "Find a salon", icon: Compass },
    ...(isSignedIn
      ? [
          { href: "/profile/bookings", label: "My bookings", icon: CalendarDots },
          { href: "/profile/favorites", label: "Favorites", icon: Heart },
        ]
      : []),
    { href: "/for-business", label: "For business", icon: Storefront },
  ];

  return (
    <>
      <header className="sticky top-0 z-[70] w-full">
        {/* Gradient mask: hides content that scrolls through the transparent gap above the pill.
            Uses the --background token (not --surface) since MainLayout and every page besides
            the homepage render Navbar over bg-background. */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-background/80 to-transparent" />

        <div className="relative max-w-[1440px] mx-auto px-4 py-3">
          <nav className="flex justify-between items-center bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_2px_20px_rgba(0,0,0,0.05)] rounded-full px-5 py-3">
            {/* Logo + desktop links */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                <div className="flex items-center gap-0.5 text-xl font-bold tracking-tight select-none">
                  <span className="text-foreground">The</span>
                  <span className="text-primary">Beauty</span>
                  <span className="text-foreground">App</span>
                </div>
              </Link>

              <div className="hidden md:flex gap-4 items-center">
                <Link
                  href="/explore"
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    pathname === "/explore"
                      ? "text-primary"
                      : "text-gray-500 hover:text-foreground",
                  )}
                >
                  Find a salon
                </Link>
                {isSignedIn && (
                  <Link
                    href="/for-business"
                    className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      pathname === "/for-business"
                        ? "text-primary"
                        : "text-gray-500 hover:text-foreground",
                    )}
                  >
                    For business
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop auth */}
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/profile/bookings"
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium transition-colors duration-200",
                      pathname === "/profile/bookings"
                        ? "text-primary"
                        : "text-gray-500 hover:text-foreground",
                    )}
                  >
                    <CalendarDots className="size-4" /> My bookings
                  </Link>
                  <Link
                    href="/profile/favorites"
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium transition-colors duration-200",
                      pathname === "/profile/favorites"
                        ? "text-primary"
                        : "text-gray-500 hover:text-foreground",
                    )}
                  >
                    <Heart className="size-4" /> Favorites
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Account menu"
                      className="cursor-pointer"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(user?.email ?? "")}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href="/profile" />}>
                        <UserCircle className="size-4" />
                        View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/8 rounded-full px-4 cursor-pointer"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/for-business">
                    <Button
                      size="sm"
                      className="rounded-full px-5 cursor-pointer"
                    >
                      List your business
                    </Button>
                  </Link>
                </div>
              )}

              {/* Animated hamburger → X */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative size-8 flex items-center justify-center md:hidden rounded-full hover:bg-black/5 transition-colors duration-200"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={cn(
                    "absolute h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    menuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5",
                  )}
                />
                <span
                  className={cn(
                    "absolute h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    menuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5",
                  )}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Fullscreen mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/96" />

        <div className="relative z-10 flex flex-col h-full pt-24 px-6 pb-8">
          {/* Logged-in user header */}
          {isSignedIn && (
            <div
              className={cn(
                "flex items-center gap-4 mb-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                menuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6",
              )}
              style={{ transitionDelay: menuOpen ? "40ms" : "0ms" }}
            >
              <Avatar className="w-12 h-12 border border-primary/20">
                <AvatarFallback>{getInitials(user?.email ?? "")}</AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-foreground">{user?.email ?? "Your account"}</p>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="ml-auto"
              >
                <GearSix className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            </div>
          )}

          {/* Staggered nav links */}
          <nav className="flex-1">
            {mobileNavItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 py-4 border-b border-black/5 text-2xl font-headline font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    pathname === item.href
                      ? "text-primary"
                      : "text-foreground/75 hover:text-foreground",
                    menuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6",
                  )}
                  style={{
                    transitionDelay: menuOpen ? `${(i + 1) * 80}ms` : "0ms",
                  }}
                >
                  <Icon size={22} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom auth actions */}
          <div
            className={cn(
              "pt-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              menuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6",
            )}
            style={{
              transitionDelay: menuOpen
                ? `${(mobileNavItems.length + 1) * 80}ms`
                : "0ms",
            }}
          >
            {isSignedIn ? (
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="w-full font-semibold rounded-full h-12"
              >
                Log out
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-bold text-lg text-foreground">Join the community</p>
                <p className="text-sm text-muted-foreground -mt-1">
                  Sign in to book appointments, save favorites, and get
                  personalised recommendations.
                </p>
                <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full font-semibold rounded-full h-12 mt-2">
                    Sign in / Register
                  </Button>
                </Link>
                <Link href="/for-business" onClick={() => setMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full font-semibold rounded-full h-12"
                  >
                    List your business
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
