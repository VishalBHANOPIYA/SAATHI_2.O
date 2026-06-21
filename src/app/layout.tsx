import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";



export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f766e",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "Saathi — AI Health Companion",
  description: "AI-powered disease screening, vitals tracking, voice symptoms, and health records companion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Saathi",
  },
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Saathi — AI Health Companion",
    description: "AI-powered disease screening, vitals tracking, voice symptoms, and health records companion.",
    type: "website",
    siteName: "Saathi",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Saathi AI Health Companion Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased bg-white md:bg-slate-50 min-h-screen overflow-x-hidden`} style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
