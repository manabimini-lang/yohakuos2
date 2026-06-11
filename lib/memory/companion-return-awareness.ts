import { prisma } from "@/lib/prisma";
import {
  detectReturningFragments,
  detectTemporalEchoes,
  detectCalmResurfacing,
} from "@/lib/memory/return-engine";

/**
 * Companion Return Awareness
 * 
 * Companion が静かな戻りを認識し、
 * 対話の中で自然に織り込む。
 */

export async function getCompanionReturnContext(userId: string): Promise<{
  isAware: boolean;
  context: string;
  fragment?: string;
  narrative?: string;
}> {
  try {
    // Check if return detection has happened recently
    const recentReturnJob = await prisma.aIJob.findFirst({
      where: {
        userId,
        jobType: { in: ["detect_returning_fragments", "detect_temporal_echoes", "detect_calm_resurfacing"] },
        status: "completed",
        completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Within 7 days
      },
      orderBy: { completedAt: "desc" },
    });

    if (!recentReturnJob) {
      return { isAware: false, context: "" };
    }

    // Get most significant returning fragment
    const fragments = await detectReturningFragments(userId);

    if (fragments.length === 0) {
      return { isAware: false, context: "" };
    }

    const mostSignificant = fragments[0];
    const narrative = `「${mostSignificant.content}」が、${Math.floor(mostSignificant.daysSinceFading / 30)}ヶ月の沈黙のあと、静かに戻っています。`; // Simplified narrative due to schema limitations

    return {
      isAware: true,
      context: "return-awareness",
      fragment: mostSignificant.content,
      narrative,
    };
  } catch (error) {
    console.error("Failed to get companion return context:", error);
    return { isAware: false, context: "" };
  }
}

/**
 * Generate a system prompt context for Companion
 * about the quiet returns user is experiencing
 */
export function generateCompanionReturnSystemPrompt(
  userContext: { isAware: boolean; narrative?: string; fragment?: string }
): string {
  if (!userContext.isAware) {
    return "";
  }

  return `
---
Quiet Return Awareness:
${userContext.fragment ? `静かな戻り: 「${userContext.fragment}」` : ""}
${userContext.narrative ? `ナラティブ: ${userContext.narrative}` : ""}

この文脈を、自然に、控えめに、対話の中に織り込んでください。
決して押しつけず、ユーザーが気づく程度の柔らかさで。
---
`;
}

/**
 * Get suggestions for Companion about returns
 */
export async function getCompanionReturnSuggestions(
  userId: string
): Promise<string[]> {
  try {
    const fragments = await detectReturningFragments(userId);

    if (fragments.length === 0) {
      return [];
    }

    const suggestions: string[] = [];

    // Top 2-3 fragments as potential topics
    fragments.slice(0, 3).forEach((fragment) => {
      suggestions.push(
        `「${fragment.content}」という言葉が、${Math.floor(fragment.daysSinceFading / 30)}ヶ月ぶりに静かに戻ってきています。`
      );
    });

    return suggestions;
  } catch (error) {
    console.error("Failed to get companion return suggestions:", error);
    return [];
  }
}
