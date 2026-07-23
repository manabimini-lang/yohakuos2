import { getUserOwnedApiCredentials, generateText } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { buildSecretaryPrompt, buildNotificationPrompt } from "./prompt_builder";
import type { YuiMorningBrief } from "./brief_service";
import type { YuiNotificationPreview } from "./models";

export async function isYuiAiEnabled(userId: string): Promise<boolean> {
  try {
    const settings = await prisma.userAISettings.findUnique({
      where: { userId },
    });
    return Boolean(settings?.isEnabled && settings?.encryptedApiKey);
  } catch (e) {
    return false;
  }
}

export async function refineBriefWithAI(
  userId: string,
  rawBrief: YuiMorningBrief,
): Promise<YuiMorningBrief> {
  const enabled = await isYuiAiEnabled(userId);
  if (!enabled) {
    return rawBrief;
  }

  try {
    const creds = await getUserOwnedApiCredentials(userId);
    if (!creds?.apiKey) {
      return rawBrief;
    }

    const { systemPrompt, userPrompt } = buildSecretaryPrompt({ brief: rawBrief });
    const { text } = await generateText(userPrompt, systemPrompt, {
      apiKey: creds.apiKey,
      userId,
    });

    if (!text) {
      return rawBrief;
    }

    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== "object" || parsed === null) {
      return rawBrief;
    }

    return {
      ...rawBrief,
      greeting: typeof parsed.greeting === "string" ? parsed.greeting : rawBrief.greeting,
      yesterdaySummary: typeof parsed.yesterdaySummary === "string" ? parsed.yesterdaySummary : rawBrief.yesterdaySummary,
      summary: typeof parsed.summary === "string" ? parsed.summary : rawBrief.summary,
      reason: typeof parsed.reason === "string" ? parsed.reason : rawBrief.reason,
      nextAction: typeof parsed.nextAction === "string" ? parsed.nextAction : rawBrief.nextAction,
    };
  } catch (e) {
    console.error("[YUI AI Integration] Failed to refine brief with AI, fallback to Rule Engine", e);
    return rawBrief;
  }
}

export async function refineNotificationWithAI(
  userId: string,
  rawPreview: YuiNotificationPreview,
): Promise<YuiNotificationPreview> {
  const enabled = await isYuiAiEnabled(userId);
  if (!enabled) {
    return rawPreview;
  }

  try {
    const creds = await getUserOwnedApiCredentials(userId);
    if (!creds?.apiKey) {
      return rawPreview;
    }

    const { systemPrompt, userPrompt } = buildNotificationPrompt({
      title: rawPreview.title,
      message: rawPreview.message,
    });

    const { text } = await generateText(userPrompt, systemPrompt, {
      apiKey: creds.apiKey,
      userId,
    });

    if (!text) {
      return rawPreview;
    }

    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== "object" || parsed === null || typeof parsed.message !== "string") {
      return rawPreview;
    }

    return {
      ...rawPreview,
      title: typeof parsed.title === "string" ? parsed.title : rawPreview.title,
      message: parsed.message,
    };
  } catch (e) {
    console.error("[YUI AI Integration] Failed to refine notification with AI, fallback to Rule Engine", e);
    return rawPreview;
  }
}
