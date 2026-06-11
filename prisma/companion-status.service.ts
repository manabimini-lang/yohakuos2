import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ConversationStatus = 'STABLE' | 'CAUTION' | 'NEEDS_SUPPORT';

export const getConversationStatus = async (userId: string): Promise<{ status: ConversationStatus; label: string }> => {
  const [latestDailyLog, latestReflection, latestAuditLog] = await Promise.all([
    prisma.dailyLog.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.reflection.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where: { actorId: userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
  ]);

  const dates = [latestDailyLog?.createdAt, latestReflection?.createdAt, latestAuditLog?.createdAt]
    .filter((d): d is Date => d instanceof Date);

  const lastActivityDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  if (!lastActivityDate) {
    return { status: 'NEEDS_SUPPORT', label: 'まだYOHAKUとの対話が始まっていません。' };
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 4) {
    return { status: 'STABLE', label: 'YOHAKUとの対話が続いています。' };
  } else if (diffDays < 14) {
    return { status: 'CAUTION', label: '最近、YOHAKUとの対話が落ち着いています。' };
  } else {
    return { status: 'NEEDS_SUPPORT', label: '必要に応じて伴走状況をご確認ください。' };
  }
};