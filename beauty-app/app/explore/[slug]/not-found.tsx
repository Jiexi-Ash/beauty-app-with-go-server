import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  MapPinPlus,
  Scissors,
  ShieldCheck,
  ThumbsUp,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";

function BusinessNotFound() {
  return (
    <div className="w-full min-h-screen relative">
      <Navbar />


      <div className="absolute inset-0 z-0">
        <Image
          src="/salon-image-placeholder.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12">

        <h1 className="text-5xl font-bold text-gray-900 text-center mb-3">
          Not found.
        </h1>
        <p className="text-gray-600 text-center max-w-sm mb-10">
          {"We're expanding rapidly to bring local salons onboard. Your favourite salon will be on the map soon."}
        </p>


        <div className="flex items-center justify-center gap-3 mb-12">
          <Button className="rounded-full h-11 px-6 hover:bg-primary/80" size="lg">
            <Scissors className="size-4 text-white" /> List Your Salon
          </Button>
          <Button
            variant="outline"
            className="rounded-full h-11 px-6 border-2 border-primary text-primary hover:bg-primary/5"
            size="lg"
          >
            <MapPinPlus className="size-4 text-primary" /> Nominate a Salon
          </Button>
        </div>


        <div className="w-full max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {"Let's Build"}{" "}
              <span className="text-primary">Together</span>
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {"Our platform is more than just a directory. It's a  community-led movement to empower local salons."}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex flex-col gap-6">
                  <div className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                    <ThumbsUp className="size-5 text-primary" />
                  </div>
                  <CardTitle className="font-bold">You Recommend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Submit the names of salons or beauty businesses in your
                  neighbourhood. We prioritise based on community demand.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex flex-col gap-6">
                  <div className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                    <ShieldCheck className="size-5 text-primary" />
                  </div>
                  <CardTitle className="font-bold">We Verify</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Nominated businesses are researched and verified to ensure
                  they meet quality and safety standards before listing.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex flex-col gap-6">
                  <div className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                    <TrendUp className="size-5 text-primary" />
                  </div>
                  <CardTitle className="font-bold">Grow</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Salons get access to booking tools, visibility, and a wider
                  audience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default BusinessNotFound;