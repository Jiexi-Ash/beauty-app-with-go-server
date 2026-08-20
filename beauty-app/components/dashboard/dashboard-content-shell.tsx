"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HAS_OWN_ACTION_BAR } from "./footer";

function DashboardContentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasOwnActionBar = HAS_OWN_ACTION_BAR.test(pathname);

  return (
    <div className={cn(!hasOwnActionBar && "pb-20 lg:pb-0")}>{children}</div>
  );
}

export default DashboardContentShell;
