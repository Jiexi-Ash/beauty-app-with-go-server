import { getAuthToken } from "@/auth";
import DashboardContent from "@/components/dashboard/dashboardContent";
import { goFetch } from "@/lib/go-api";
import { redirect } from "next/navigation";

async function DashboardPage() {
  const token = await getAuthToken();
  if (!token) redirect("/sign-in?redirect_url=/dashboard");

  const response = await goFetch("/owner/salon", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) redirect("/onboarding");
  return <DashboardContent />;
}

export default DashboardPage;
