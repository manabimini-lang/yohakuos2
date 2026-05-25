// AI Cost Tracker
// Gemini 3.1 Pro Low の料金体系に基づく推定

const COST_PER_INPUT_TOKEN = 0.000000125; // $0.125 per 1M tokens (input)
const COST_PER_OUTPUT_TOKEN = 0.0000005; // $0.50 per 1M tokens (output)

export interface CostEstimate {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
    estimatedCostJPY: number;
}

const JPY_RATE = 150; // approximate USD/JPY rate

export function estimateCost(inputTokens: number, outputTokens: number): CostEstimate {
    const costUSD =
        inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;
    return {
        inputTokens,
        outputTokens,
        estimatedCostUSD: Math.round(costUSD * 1000000) / 1000000,
        estimatedCostJPY: Math.round(costUSD * JPY_RATE * 100) / 100,
    };
}

export function estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for Japanese text
    return Math.ceil(text.length / 4);
}

// Budget management
const MONTHLY_BUDGET_USD = 5.0; // $5/month per user (approx ¥750)
const DAILY_BUDGET_USD = MONTHLY_BUDGET_USD / 30;

export function checkBudget(
    dailyUsage: number,
    monthlyUsage: number
): { withinBudget: boolean; dailyRemaining: number; monthlyRemaining: number } {
    return {
        withinBudget: dailyUsage <= DAILY_BUDGET_USD && monthlyUsage <= MONTHLY_BUDGET_USD,
        dailyRemaining: Math.round((DAILY_BUDGET_USD - dailyUsage) * 1000) / 1000,
        monthlyRemaining: Math.round((MONTHLY_BUDGET_USD - monthlyUsage) * 1000) / 1000,
    };
}