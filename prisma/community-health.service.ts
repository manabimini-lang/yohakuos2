import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CommunityHealthStats {
  weeklySharedCount: number;
  weeklyParticipantsCount: number;
  mostSharedTag: { tag: string; count: number } | null;
}

export const getCommunityHealthStats = async (): Promise<CommunityHealthStats> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // 今週の最初の日曜日に設定
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // 今週の土曜日に設定
  endOfWeek.setHours(23, 59, 59, 999);

  // 今週の共有件数
  const weeklySharedKnowledge = await prisma.sharedKnowledge.findMany({
    where: {
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    select: {
      createdBy: true,
      tags: true,
    },
  });

  const weeklySharedCount = weeklySharedKnowledge.length;

  // 今週共有に参加した人数
  const weeklyParticipantsCount = new Set(weeklySharedKnowledge.map((sk) => sk.createdBy)).size;

  // 最も共有されたタグ
  const tagCounts: { [key: string]: number } = {};
  weeklySharedKnowledge.forEach((sk) => {
    (sk.tags as string[]).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const mostSharedTag = Object.entries(tagCounts).sort(([, countA], [, countB]) => countB - countA)[0] || null;

  return {
    weeklySharedCount,
    weeklyParticipantsCount,
    mostSharedTag: mostSharedTag ? { tag: mostSharedTag[0], count: mostSharedTag[1] } : null,
  };
};