import type { ShareProvider, SharePayload, ShareResult } from "../types";

export class DiscordShareProvider implements ShareProvider {
  async send(payload: SharePayload): Promise<ShareResult> {
    const webhookUrl =
      process.env.DISCORD_SHARE_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      return {
        success: false,
        error: "Discord Webhook URL が設定されていません",
      };
    }

    const date = new Date(payload.createdAt).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const userLabel = payload.userName
      ? `${payload.userName}さんの余白`
      : "余白の記録";

    const content = [
      `🌱 **${payload.title}**`,
      "",
      payload.content,
      "",
      "────",
      "",
      `${date}`,
      userLabel,
    ].join("\n");

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Discord API error: ${response.status}`,
        };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}
