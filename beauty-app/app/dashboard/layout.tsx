import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardFooter from "@/components/dashboard/footer";
import DashboardContentShell from "@/components/dashboard/dashboard-content-shell";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex-1 w-full min-h-screen bg-background">
        <DashboardHeader />
        <DashboardContentShell>{children}</DashboardContentShell>
        <DashboardFooter />
      </main>
    </SidebarProvider>
  );
}
