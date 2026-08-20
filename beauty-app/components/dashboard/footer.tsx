"use client";
import { cn } from "@/lib/utils";
import {
  CalendarDots,
  GearSix,
  type Icon,
  Scissors,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navlinks = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDots },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/clients", label: "Clients", icon: UsersThree },
  { href: "/dashboard/settings", label: "Settings", icon: GearSix },
];
// Focused create/edit task screens (e.g. /dashboard/services/create-service,
// /dashboard/services/[id]) render their own sticky bottom action bar, which
// would overlap this sticky nav if both were shown at once.
export const HAS_OWN_ACTION_BAR = /^\/dashboard\/services\/[^/]+$/;

function DashboardFooter() {
  const pathname = usePathname();
  if (HAS_OWN_ACTION_BAR.test(pathname)) return null;

  return (
    <footer className="fixed inset-x-0 bottom-0 lg:hidden bg-background z-50 border-t border-border grid grid-cols-5 gap-1 px-2">
      {navlinks.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);

        return (
          <Navlink
            key={link.label}
            Icon={link.icon}
            label={link.label}
            href={link.href}
            isActive={isActive}
          />
        );
      })}
    </footer>
  );
}

export default DashboardFooter;

const Navlink = ({
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
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1 py-3 px-1 items-center transition-colors duration-200",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      <LinkIcon className="size-5" weight={isActive ? "fill" : "regular"} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};
