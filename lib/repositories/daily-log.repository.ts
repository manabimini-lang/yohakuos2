import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

export class DailyLogRepository {
  async createLog(userId: string, inputText: string, aiResponse: string, moodTag?: string, smallAction?: string) {
    return prisma.dailyLog.create({
      data: {
        userId,
        inputText,
        aiResponse,
        moodTag,
        smallAction,
      },
    });
  }

  async findRecentByUserId(userId: string, limit: number = 50, offset: number = 0, moodTag?: string) {
    return prisma.dailyLog.findMany({
      where: {
        userId,
        ...(moodTag ? { moodTag } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async countByUserId(userId: string, moodTag?: string) {
    return prisma.dailyLog.count({
      where: {
        userId,
        ...(moodTag ? { moodTag } : {}),
      },
    });
  }

  /**
   * 過去N件のログを取得し、ルールベースのインサイト生成に使う
   */
  async findForInsight(userId: string, limit: number = 20) {
    return prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        moodTag: true,
        inputText: true,
        createdAt: true,
      },
    });
  }
}

export const dailyLogRepository = new DailyLogRepository();
export { PAGE_SIZE };
