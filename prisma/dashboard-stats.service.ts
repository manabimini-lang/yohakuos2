import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TodayYohakuStats {
  savedYohakuCount: number;
  reflectedUsersCount: number;
  suggestionsDeliveredCount: number;
  sharedKnowledgeCount: number;
}

export const getTodayYohakuStats = async (): Promise<TodayYohakuStats> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 1. 今日生まれた余白（保存数）
  const savedYohakuCount = await prisma.dailyLog.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // 2. 今日振り返った人数
  const reflectedUsersCount = await prisma.reflection.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    distinct: ['userId'], // ユニークユーザー数をカウント
  });

  // 3. 今日届けられた提案数 (AuditLog category = "ai")
  const suggestionsDeliveredCount = await prisma.auditLog.count({
    where: {
      category: 'ai',
      action: { in: ['ai.suggestion.delivered', 'ai.suggestion.generated'] }, // 適切なアクション名に調整
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // 4. 今日共有された知見数 (SharedKnowledge)
  const sharedKnowledgeCount = await prisma.sharedKnowledge.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  return { savedYohakuCount, reflectedUsersCount, suggestionsDeliveredCount, sharedKnowledgeCount };
};