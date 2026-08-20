import Navbar from "@/components/navbar";
import Hero from "@/components/home/hero";
import PopularSalons from "@/components/home/popular-salons";
import BusinessTeaser from "@/components/home/business-teaser";
import Footer from "@/components/footer";
import { goFetch } from "@/lib/go-api";

type SalonResponse = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  cover_image_url: string | null;
};

export default async function Home() {
  const response = await goFetch("/salons");
  const salons: SalonResponse[] = response.ok ? await response.json() : [];

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white">
      <Navbar />
      <main id="main-content">
        <Hero />
        <PopularSalons salons={(salons ?? []).slice(0, 3)} />
        <BusinessTeaser />
      </main>
      <Footer />
    </div>
  );
}
