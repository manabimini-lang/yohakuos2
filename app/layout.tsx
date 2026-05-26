import type { Metadata } from "next";
import { PWAProvider } from "@/components/pwa-provider";
import { SessionProvider } from "next-auth/react";
import { CaptureLayer } from "@/components/capture/CaptureLayer";

export const dynamic = "force-dynamic";
import { Noto_Sans_JP } from "next/font/google";

import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

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

import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ja" className={notoSansJP.variable}>
      <head>
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={notoSansJP.className}>
        <SessionProvider session={session}>
          <PWAProvider>
            {children}
            {session && <CaptureLayer />}
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
