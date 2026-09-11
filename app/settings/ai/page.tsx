import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - AI接続設定",
  description: "AI（Gemini / Groq API）の接続設定を行います",
};

export default async function AiSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  redirect("/yui/settings#ai");
}
