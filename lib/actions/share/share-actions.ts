"use server";

import { generateShareMarkdown } from "@/lib/ai/share-generator";
import type { YohakuResult } from "@/lib/ai/yohaku-generator";

export async function shareToDiscordAction(yohaku: YohakuResult) {
  const webhookUrl = process.env.DISCORD_SHARE_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("Discord Webhook URL is not configured");
  }

  const markdown = generateShareMarkdown(yohaku);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: markdown,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to share to Discord");
  }

  return { success: true };
}
