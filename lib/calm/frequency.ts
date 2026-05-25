import { prisma } from "@/lib/prisma";
import { DEFAULT_FREQUENCY_GOVERNANCE } from "./types";

export async function checkSilenceWindow(): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    const config = DEFAULT_FREQUENCY_GOVERNANCE;

    for (const window of config.silenceWindows) {
        if (window.start <= window.end) {
            if (hour >= window.start && hour < window.end) return true;
        } else {
            if (hour >= window.start || hour < window.end) return true;
        }
    }

    return false;
}

export async function shouldSuppressAppearance(
    userId: string
): Promise<{ suppress: boolean; reason: string | null }> {
    const config = DEFAULT_FREQUENCY_GOVERNANCE;

    if (config.quietMode) {
        return { suppress: true, reason: "静音モードが有効です" };
    }

    if (await checkSilenceWindow()) {
        return { suppress: true, reason: "沈黙ウィンドウ中です" };
    }

    if (config.emotionalCooldownEnabled) {
        const activeCooldowns = await prisma.emotionalCooldown.findMany({
            where: { userId, expiresAt: { gt: new Date() } },
            orderBy: { intensity: "desc" },
            take: 1,
        });

        if (activeCooldowns.length > 0 && activeCooldowns[0].intensity >= 5) {
            return { suppress: true, reason: "感情クールダウン中です" };
        }
    }

    if (config.overloadPrevention) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = await prisma.ambientInsight.count({
            where: {
                userId,
                surfacedAt: { gte: today },
            },
        });

        if (todayCount >= config.maxDailyAppearances) {
            return { suppress: true, reason: "1日の最大出現数に達しました" };
        }
    }

    return { suppress: false, reason: null };
}

export async function getFrequencyReport(userId: string): Promise<{
    todayCount: number;
    maxDaily: number;
    isSilenceWindow: boolean;
    activeCooldowns: number;
    quietMode: boolean;
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, activeCooldowns] = await Promise.all([
        prisma.ambientInsight.count({
            where: { userId, surfacedAt: { gte: today } },
        }),
        prisma.emotionalCooldown.count({
            where: { userId, expiresAt: { gt: new Date() } },
        }),
    ]);

    return {
        todayCount,
        maxDaily: DEFAULT_FREQUENCY_GOVERNANCE.maxDailyAppearances,
        isSilenceWindow: await checkSilenceWindow(),
        activeCooldowns,
        quietMode: DEFAULT_FREQUENCY_GOVERNANCE.quietMode,
    };
}