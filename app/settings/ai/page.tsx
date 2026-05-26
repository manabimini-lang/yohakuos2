import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AiSettingsClient } from "@/components/settings/ai-settings-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - AI接続設定",
  description: "AI（Gemini API）の接続設定を行います",
};

export default async function AiSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const settings = await prisma.userAISettings.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <AiSettingsClient
        initialSettings={
          settings
            ? {
                provider: settings.provider,
                hasKey: !!settings.encryptedApiKey,
                model: settings.model || "",
                isEnabled: settings.isEnabled,
              }
            : null
        }
      />
    </div>
  );
}
