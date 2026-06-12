import type { Metadata } from "next";
import { PWAProvider } from "@/components/pwa-provider";
import { SessionProvider } from "next-auth/react";
import { CaptureLayer } from "@/components/capture/CaptureLayer";
import { auth } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "YOHAKU",
    template: "%s | YOHAKU",
  },
  description: "止まっても、戻ってこれる場所。",
  manifest: "/manifest.json",
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
      <body className="min-h-screen bg-[#090909] text-slate-100 antialiased">
        <SessionProvider session={session}>
          <PWAProvider>
            <div className="min-h-screen">
              {children}
              {session && <CaptureLayer />}
            </div>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
