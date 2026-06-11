import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AiFailureCategory = 'Timeout' | 'Rate Limit' | 'Provider Error' | 'Validation Error' | 'Other';

export interface AiProviderStats {
  provider: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}

export interface AiHealthReport {
  overall: {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    successRate: number;
  };
  providers: AiProviderStats[];
  failureCategories: Record<AiFailureCategory, number>;
}

export const classifyAiError = (errorDetail: string): AiFailureCategory => {
  const detailLower = errorDetail.toLowerCase();
  if (detailLower.includes('timeout')) return 'Timeout';
  if (detailLower.includes('429') || detailLower.includes('rate limit')) return 'Rate Limit';
  if (detailLower.includes('provider') || detailLower.includes('500') || detailLower.includes('internal server error')) return 'Provider Error';
  if (detailLower.includes('validation') || detailLower.includes('invalid input')) return 'Validation Error';
  return 'Other';
};

export const getAiHealthReport = async (timeframeDays: number = 7): Promise<AiHealthReport> => {
  const startOfPeriod = new Date();
  startOfPeriod.setDate(startOfPeriod.getDate() - timeframeDays);

  const aiLogs = await prisma.auditLog.findMany({
    where: {
      category: 'ai',
      createdAt: { gte: startOfPeriod },
    },
    select: {
      action: true,
      severity: true,
      metadata: true,
    },
  });

  const providerMap: Map<string, { success: number; failure: number }> = new Map();
  const failureCategories: Record<AiFailureCategory, number> = {
    Timeout: 0,
    'Rate Limit': 0,
    'Provider Error': 0,
    'Validation Error': 0,
    Other: 0,
  };

  for (const log of aiLogs) {
    const provider = (log.metadata as any)?.provider || 'unknown';
    const isSuccess = log.severity !== 'error' && log.severity !== 'critical';

    if (!providerMap.has(provider)) providerMap.set(provider, { success: 0, failure: 0 });
    const stats = providerMap.get(provider)!;

    if (isSuccess) {
      stats.success++;
    } else {
      stats.failure++;
      const errorDetail = (log.metadata as any)?.errorMessage || (log.metadata as any)?.error || '';
      failureCategories[classifyAiError(errorDetail)]++;
    }
  }

  const providers = Array.from(providerMap.entries()).map(([provider, s]) => ({
    provider,
    totalAttempts: s.success + s.failure,
    successCount: s.success,
    failureCount: s.failure,
    successRate: s.success + s.failure > 0 ? s.success / (s.success + s.failure) : 0,
  }));

  const totalAttempts = aiLogs.length;
  const totalSuccess = providers.reduce((sum, p) => sum + p.successCount, 0);

  return {
    overall: {
      totalAttempts,
      successCount: totalSuccess,
      failureCount: totalAttempts - totalSuccess,
      successRate: totalAttempts > 0 ? totalSuccess / totalAttempts : 0,
    },
    providers,
    failureCategories,
  };
};