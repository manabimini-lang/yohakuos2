import type { Metadata } from "next";
import { PWAProvider } from "@/components/pwa-provider";
import { SessionProvider } from "next-auth/react";
import { CaptureLayer } from "@/components/capture/CaptureLayer";
import { auth } from "@/lib/auth";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-sans-jp" });

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
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.variable} ${notoSansJP.variable} font-sans`}>
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
