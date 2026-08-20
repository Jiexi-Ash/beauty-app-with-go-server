import Navbar from "@/components/navbar";
import ForBusinessHero from "@/components/for-business/hero";
import Features from "@/components/for-business/features";
import Pricing from "@/components/for-business/pricing";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Business Owners | TheBeautyApp",
  description:
    "List your salon for free. No subscriptions — just a small, capped fee on deposits when you get paid.",
};

export default function ForBusinessPage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white">
      <Navbar />
      <main id="main-content">
        <ForBusinessHero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
