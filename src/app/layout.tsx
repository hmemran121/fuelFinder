import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/common/BottomNav";
import { BroadcastOverlay } from "@/components/common/BroadcastOverlay";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationManager } from "@/components/common/NotificationManager";
import { AlertSettingsModal } from "@/components/common/AlertSettingsModal";
import { PWAInstallPrompt } from "@/components/common/PWAInstallPrompt";

const geistSans = Geist({

  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fuel-finder-dhaka.vercel.app"),
  title: "তেল পাম্প খুঁজুন | Fuel Finder Dhaka",
  description: "ঢাকার সমস্ত সিএনজি এবং ফিলিং স্টেশনের রিয়েল-টাইম আপডেট পান।",
  keywords: ["Fuel Finder", "Dhaka Fuel", "CNG Station", "Petrol Pump Dhaka", "Live Fuel Status"],
  authors: [{ name: "Nexus Intelligence" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Fuel Finder Dhaka | Real-time Fuel Tracking",
    description: "Locate active petrol pumps and CNG stations in Dhaka in real-time.",
    url: "https://fuel-finder-dhaka.vercel.app",
    siteName: "Fuel Finder Dhaka",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fuel Finder Dhaka Interface",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuel Finder Dhaka | Live Status",
    description: "Don't wait in line. Check fuel availability in Dhaka before you leave home.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="light">

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AuthProvider>
          <main className="relative min-h-screen">
            <BroadcastOverlay />
            <NotificationManager />
            <AlertSettingsModal />
            <PWAInstallPrompt />
            {children}
            <BottomNav />
          </main>

        </AuthProvider>
      </body>
    </html>
  );
}

