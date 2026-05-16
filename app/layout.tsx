import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "YOHAKU - 学びを、余白のある習慣に",
    template: "%s | YOHAKU",
  },
  description:
    "短い記事と実践タスクで、学びを無理なく日常に組み込む学習プラットフォームです。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
