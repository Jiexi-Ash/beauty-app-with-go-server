"use client";

import { Bell } from "@phosphor-icons/react";
import { toast } from "sonner";

// Notifications have no Go API equivalent yet (were Convex-backed) — stubbed
// out until a notifications endpoint exists on the Go server.
function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={() => toast.info("Notifications aren't wired up yet — coming soon.")}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
    >
      <Bell className="size-5" />
    </button>
  );
}

export default NotificationBell;
