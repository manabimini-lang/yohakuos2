// ===================================================
// YOHAKU Life OS — Companion Boundary Rules
// ===================================================
//
// 共通AI出現制御。
// shouldRespond / shouldStaySilent / shouldDefer を
// Companion 外部へ共通化。
//
// 将来:
// - ambient AI
// - voice AI
// - passive AI
// へ共有可能に。
//

import { prisma } from "@/lib/prisma";
import { BoundaryDecision, CooldownType } from "./types";

/**
 * AIが応答すべきか判定する（共通ゲートウェイ）
 */
export async function shouldRespond(userId: string): Promise<BoundaryDecision> {
    // 1. Emotional cooldown check
    const activeCooldowns = await prisma.emotionalCooldown.findMany({
        where: {
            userId,
            expiresAt: { gt: new Date() },
        },
        orderBy: { intensity: "desc" },
        take: 3,
    });

    if (activeCooldowns.length > 0) {
        const highest = activeCooldowns[0];
        if (highest.intensity >= 7) {
            // High intensity cooldown → stay silent
            return {
                shouldRespond: false,
                shouldStaySilent: true,
                shouldDefer: false,
                reason: `感情的なクールダウン期間中です（${highest.cooldownType}）`,
                suggestedSilenceMinutes: Math.ceil(
                    (highest.expiresAt.getTime() - Date.now()) / (1000 * 60)
                ),
            };
        }

        if (highest.cooldownType === "anxiety_repetition") {
            return {
                shouldRespond: false,
                shouldStaySilent: true,
                shouldDefer: true,
                reason: "繰り返しの不安パターンを検出しました。静かな時間を提案します。",
                deferTarget: "quiet_reflection",
                suggestedSilenceMinutes: 60,
            };
        }
    }

    // 2. Check for recent companion activity
    const recentMessage = await prisma.companionMessage.findFirst({
        where: { conversation: { userId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });

    if (recentMessage) {
        const hoursSinceLastActivity =
            (Date.now() - recentMessage.createdAt.getTime()) / (1000 * 60 * 60);

        // Minimum 2 hours between proactive responses
        if (hoursSinceLastActivity < 2) {
            return {
                shouldRespond: false,
                shouldStaySilent: true,
                shouldDefer: false,
                reason: "前回の会話からの間隔が短すぎます",
                suggestedSilenceMinutes: Math.ceil((2 - hoursSinceLastActivity) * 60),
            };
        }
    }

    // 3. Check for reflection cooldown
    const reflectionCooldown = activeCooldowns.find(
        (c) => c.cooldownType === "reflection_cooldown"
    );
    if (reflectionCooldown) {
        return {
            shouldRespond: false,
            shouldStaySilent: true,
            shouldDefer: false,
            reason: "振り返りのクールダウン期間中です",
            suggestedSilenceMinutes: Math.ceil(
                (reflectionCooldown.expiresAt.getTime() - Date.now()) / (1000 * 60)
            ),
        };
    }

    // Default: allow response
    return {
        shouldRespond: true,
        shouldStaySilent: false,
        shouldDefer: false,
        reason: null,
    };
}

/**
 * AIが沈黙すべきか判定する
 */
export async function shouldStaySilent(userId: string): Promise<BoundaryDecision> {
    const decision = await shouldRespond(userId);
    return {
        ...decision,
        shouldRespond: false,
        shouldStaySilent: !decision.shouldRespond,
    };
}

/**
 * 別のAIモードに委譲すべきか判定する
 */
export async function shouldDefer(
    userId: string,
    context: {
        isEmotional: boolean;
        isComplexReflection: boolean;
        isUrgent: boolean;
    }
): Promise<BoundaryDecision> {
    // Emotional content → defer to quiet reflection
    if (context.isEmotional) {
        const activeCooldowns = await prisma.emotionalCooldown.findMany({
            where: { userId, expiresAt: { gt: new Date() } },
        });

        if (activeCooldowns.length > 0) {
            return {
                shouldRespond: false,
                shouldStaySilent: false,
                shouldDefer: true,
                reason: "感情的な内容のため、静かな内省モードに委譲します",
                deferTarget: "quiet_reflection",
            };
        }
    }

    // Complex reflection → defer to reflection engine
    if (context.isComplexReflection) {
        return {
            shouldRespond: false,
            shouldStaySilent: false,
            shouldDefer: true,
            reason: "複雑な内省が必要なため、振り返りエンジンに委譲します",
            deferTarget: "seasonal_reflection",
        };
    }

    // Default: no deferral
    return {
        shouldRespond: true,
        shouldStaySilent: false,
        shouldDefer: false,
        reason: null,
    };
}

/**
 * Emotional Cooldown を作成する
 */
export async function createEmotionalCooldown(
    userId: string,
    cooldownType: CooldownType,
    intensity: number,
    durationHours: number = 24
): Promise<void> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await prisma.emotionalCooldown.create({
        data: {
            userId,
            cooldownType,
            intensity: Math.max(1, Math.min(10, intensity)),
            expiresAt,
        },
    });
}