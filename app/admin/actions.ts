"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getAdminStats() {
  await verifyAdmin();

  const [
    totalUsers,
    premiumUsers,
    discordShares,
    suggestedCount,
    externalCount,
    geminiUsersCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { role: "PAID_MEMBER" },
          { plan: "premium" }
        ]
      }
    }),
    prisma.sharedKnowledge.count(),
    prisma.suggestedContent.count(),
    prisma.externalContent.count(),
    prisma.userAISettings.count({
      where: { isEnabled: true }
    })
  ]);

  const geminiRatio = totalUsers > 0 ? Math.round((geminiUsersCount / totalUsers) * 100) : 0;

  // Count roads distribution from sharedKnowledge or suggestedContent or logs
  // Since we want current active roads list, let's query the count of logs per road (or static road list)
  const roadStats = [
    { id: "beginner", title: "初任者ロード", icon: "🌱", key: "beginner" },
    { id: "side-hustle", title: "副業ロード", icon: "💻", key: "side-hustle" },
    { id: "resignation", title: "退職ロード", icon: "🚪", key: "resignation" }
  ];

  // Discord status
  const discordWebhookStatus = !!process.env.DISCORD_WEBHOOK_URL;
  const discordBotStatus = !!process.env.DISCORD_BOT_TOKEN;

  return {
    stats: {
      totalUsers,
      premiumUsers,
      discordShares,
      suggestedCount,
      externalCount,
      geminiRatio,
    },
    roads: roadStats,
    discord: {
      webhook: discordWebhookStatus,
      bot: discordBotStatus,
    }
  };
}

export async function getSuggestedContents() {
  await verifyAdmin();
  return prisma.suggestedContent.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function deleteSuggestedContent(id: string) {
  await verifyAdmin();
  await prisma.suggestedContent.delete({
    where: { id }
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function promoteSuggestedContent(id: string) {
  await verifyAdmin();

  const suggestion = await prisma.suggestedContent.findUnique({
    where: { id }
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  // Create external content
  await prisma.externalContent.create({
    data: {
      title: suggestion.title,
      url: suggestion.url,
      type: suggestion.type,
      road: suggestion.road,
      tags: suggestion.tags || [],
      description: suggestion.description,
      createdBy: suggestion.createdBy,
    }
  });

  // Delete suggestion
  await prisma.suggestedContent.delete({
    where: { id }
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function getRoadPrompts() {
  await verifyAdmin();
  return prisma.road.findMany({
    where: { isActive: true },
    include: { roadPrompt: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function saveRoadPrompt(roadId: string, systemPrompt: string) {
  await verifyAdmin();

  const existing = await prisma.roadPrompt.findUnique({
    where: { roadId }
  });

  if (existing) {
    await prisma.roadPrompt.update({
      where: { roadId },
      data: { systemPrompt }
    });
  } else {
    await prisma.roadPrompt.create({
      data: {
        roadId,
        systemPrompt
      }
    });
  }

  revalidatePath("/admin/prompts");
  revalidatePath("/api/roads");
  return { ok: true };
}
