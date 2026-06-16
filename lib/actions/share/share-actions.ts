"use server";

export async function shareToDiscordAction(markdown: string) {
  const webhookUrl = process.env.DISCORD_SHARE_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("Discord Webhook URL is not configured");
  }

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