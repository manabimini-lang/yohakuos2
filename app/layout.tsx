import type { Metadata } from "next";
import { PWAProvider } from "@/components/pwa-provider";
import { SessionProvider } from "next-auth/react";
import { CaptureLayer } from "@/components/capture/CaptureLayer";
import { auth } from "@/lib/auth";
import { PWAInstallCTA } from "@/components/pwa/pwa-install-cta";
import { SettingsButton } from "@/components/ui/settings-button";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "YOHAKU",
    template: "%s | YOHAKU",
  },
  description: "止まっても、戻ってこれる場所。",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "YOHAKU",
    description: "止まっても、戻ってこれる場所。",
    url: "https://yohakuos2.vercel.app",
    siteName: "YOHAKU",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YOHAKU",
    description: "止まっても、戻ってこれる場所。",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <SessionProvider session={session}>
          <PWAProvider>
            <div className="min-h-screen">
              {children}
              {session && <CaptureLayer />}
              <PWAInstallCTA />
              {session && <SettingsButton />}
            </div>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
