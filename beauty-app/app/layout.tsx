import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppQueryProvider from "@/components/providers/query-provider"
import { AuthProvider } from "@/lib/auth-context";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Beauty App — Verified Salons, Transparent Pricing",
  description: "Book verified salons and beauty professionals near you. No hidden fees, fair community pricing.",
  openGraph: {
    title: "The Beauty App",
    description: "Book verified salons and beauty professionals near you.",
    type: "website",
    siteName: "The Beauty App",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Beauty App",
    description: "Book verified salons and beauty professionals near you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${plusJakarta.variable} antialiased font-(family-name:--font-headline)`}>
        {/* Skip to content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <AuthProvider>
          <AppQueryProvider>
            {children}
            <Toaster />
          </AppQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
