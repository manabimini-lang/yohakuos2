// ===================================================
// YOHAKU Calm Infrastructure — AI Cost Governance
// ===================================================
//
// AIコスト暴走防止:
// - job prioritization（優先度別実行制御）
// - token budgeting（トークン予算管理）
// - cost tracking（実際のコスト追跡）
// - low-frequency analysis（低頻度分析強制）
//

import { prisma } from "@/lib/prisma";
import { CostReport, CostGovernanceConfig, DEFAULT_COST_CONFIG, JobPriority, JOB_PRIORITY_MAP } from "./types";

const JPY_RATE = 150;

/**
 * 現在のコスト使用状況をレポート
 */
export async function getCostReport(userId?: string): Promise<CostReport> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereClause = userId ? { userId } : {};

    // 日次コスト
    const dailyJobs = await prisma.aIJob.findMany({
        where: {
            ...whereClause,
            status: "completed",
            completedAt: { gte: startOfDay },
        },
        select: { jobType: true, costEstimate: true, tokenUsed: true },
    });

    // 月次コスト
    const monthlyJobs = await prisma.aIJob.findMany({
        where: {
            ...whereClause,
            status: "completed",
            completedAt: { gte: startOfMonth },
        },
        select: { jobType: true, costEstimate: true, tokenUsed: true },
    });

    const dailyCost = dailyJobs.reduce((sum, j) => sum + (j.costEstimate || 0), 0);
    const monthlyCost = monthlyJobs.reduce((sum, j) => sum + (j.costEstimate || 0), 0);

    // ジョブタイプ別コスト
    const byJobType: Record<string, number> = {};
    for (const job of monthlyJobs) {
        byJobType[job.jobType] = (byJobType[job.jobType] || 0) + (job.costEstimate || 0);
    }

    // コスト上位ジョブ
    const topCostJobs = Object.entries(byJobType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([jobType, cost]) => ({ jobType, cost }));

    const config = DEFAULT_COST_CONFIG;
    const dailyBudget = config.dailyBudgetUSD;
    const monthlyBudget = config.monthlyBudgetUSD;

    return {
        daily: {
            used: Math.round(dailyCost * 1000) / 1000,
            budget: Math.round(dailyBudget * 1000) / 1000,
            remaining: Math.round((dailyBudget - dailyCost) * 1000) / 1000,
        },
        monthly: {
            used: Math.round(monthlyCost * 1000) / 1000,
            budget: Math.round(monthlyBudget * 1000) / 1000,
            remaining: Math.round((monthlyBudget - monthlyCost) * 1000) / 1000,
        },
        byJobType,
        topCostJobs,
        withinBudget: dailyCost <= dailyBudget && monthlyCost <= monthlyBudget,
    };
}

/**
 * ジョブの実行可否をコストベースで判定
 */
export async function shouldExecuteJob(
    jobType: string,
    estimatedCost: number
): Promise<{ execute: boolean; reason: string | null }> {
    const report = await getCostReport();

    // 予算超過チェック
    if (!report.withinBudget) {
        return {
            execute: false,
            reason: `月間予算超過: $${report.monthly.used.toFixed(3)} / $${report.monthly.budget.toFixed(3)}`,
        };
    }

    // 日次予算残チェック
    if (estimatedCost > report.daily.remaining) {
        return {
            execute: false,
            reason: `日次予算残不足: $${report.daily.remaining.toFixed(3)} に対し推定 $${estimatedCost.toFixed(3)}`,
        };
    }

    // 優先度ベースの抑制
    const priority = JOB_PRIORITY_MAP[jobType] ?? JobPriority.LOW;
    if (priority <= JobPriority.BACKGROUND && report.daily.used > report.daily.budget * 0.8) {
        return {
            execute: false,
            reason: "低優先度ジョブは日次予算80%超過時は抑制されます",
        };
    }

    return { execute: true, reason: null };
}

/**
 * ジョブ完了時にコストを記録
 */
export async function recordJobCost(
    jobId: string,
    inputTokens: number,
    outputTokens: number
): Promise<number> {
    const COST_PER_INPUT_TOKEN = 0.000000125;
    const COST_PER_OUTPUT_TOKEN = 0.0000005;
    const costUSD = inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;

    await prisma.aIJob.update({
        where: { id: jobId },
        data: {
            tokenUsed: inputTokens + outputTokens,
            costEstimate: costUSD,
        },
    });

    return costUSD;
}

/**
 * トークン節約モードを判定
 * 予算が逼迫している場合に自動的に節約モードを有効化
 */
export async function shouldEnableTokenSaver(): Promise<boolean> {
    const report = await getCostReport();
    const usageRatio = report.monthly.used / report.monthly.budget;
    return usageRatio > 0.7;
}

/**
 * ユーザーあたりの月間AIコストを取得
 */
export async function getUserMonthlyCost(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const jobs = await prisma.aIJob.findMany({
        where: {
            userId,
            status: "completed",
            completedAt: { gte: startOfMonth },
        },
        select: { costEstimate: true },
    });

    return jobs.reduce((sum, j) => sum + (j.costEstimate || 0), 0);
}