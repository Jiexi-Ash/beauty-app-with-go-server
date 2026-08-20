import { getAuthToken } from "@/auth";
import Onboarding from "@/components/onboarding/onboarding";
import { goFetch } from "@/lib/go-api";
import { redirect } from "next/navigation";

async function OnboardingPage() {
  const token = await getAuthToken();
  if (!token) redirect("/sign-in?redirect_url=/onboarding");

  const response = await goFetch("/owner/salon", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) redirect("/dashboard");

  return <Onboarding />;
}

export default OnboardingPage;
