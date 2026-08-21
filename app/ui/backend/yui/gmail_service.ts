import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getValidAccessToken } from "./google_calendar_service";
import { refreshMorningBriefCache } from "./brief_service";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export type YuiEmailInsight = {
  id: string;
  gmailId: string;
  subject: string;
  fromEmail: string;
  reason: "unread_3_days" | "important" | "meeting" | "deadline";
  snippet: string;
  receivedAt: string;
};

export async function syncGmailMessages(userId: string): Promise<{ fetchedCount: number; savedCount: number }> {
  // We reuse the token from google_calendar_service since we added the scope.
  const { accessToken, connectionId } = await getValidAccessToken(userId);

  // Fetch INBOX messages, limit 50
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Gmail list: ${errText}`);
  }

  const data = await response.json();
  const messages = Array.isArray(data.messages) ? data.messages : [];
  let savedCount = 0;

  for (const msg of messages) {
    if (!msg.id) continue;
    
    // Check if exists
    const existing = await supabaseAdmin
      .from("gmail_messages")
      .select("id")
      .eq("user_id", userId)
      .eq("gmail_id", msg.id)
      .maybeSingle();
      
    if (existing.data) continue; // Skip if already fetched to save API calls for this demo

    const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
    const msgRes = await fetch(msgUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!msgRes.ok) continue;
    const msgData = await msgRes.json();

    const headers = msgData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
    const fromEmail = headers.find((h: any) => h.name === "From")?.value || "Unknown";
    const toEmail = headers.find((h: any) => h.name === "To")?.value || "";
    const isRead = !(msgData.labelIds || []).includes("UNREAD");

    await supabaseAdmin.from("gmail_messages").insert({
      user_id: userId,
      connection_id: connectionId,
      gmail_id: msgData.id,
      thread_id: msgData.threadId || msgData.id,
      subject,
      from_email: fromEmail,
      to_email: toEmail,
      snippet: msgData.snippet || "",
      received_at: new Date(parseInt(msgData.internalDate)).toISOString(),
      is_read: isRead,
      labels: msgData.labelIds || [],
      updated_at: new Date().toISOString(),
    });
    savedCount++;
  }

  try {
    await refreshMorningBriefCache(userId);
  } catch (error) {
    console.error("Failed to refresh cached morning brief after Gmail sync", error);
  }

  return { fetchedCount: messages.length, savedCount };
}

export async function getGmailInsights(userId: string): Promise<YuiEmailInsight[]> {
  const { data: messages } = await supabaseAdmin
    .from("gmail_messages")
    .select("*")
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .limit(50);

  if (!messages) return [];

  const insights: YuiEmailInsight[] = [];
  const now = Date.now();

  for (const msg of messages) {
    const receivedMs = new Date(msg.received_at).getTime();
    const daysAgo = (now - receivedMs) / (1000 * 60 * 60 * 24);

    let reason: YuiEmailInsight["reason"] | null = null;
    
    const subjectLower = msg.subject.toLowerCase();
    const snippetLower = msg.snippet.toLowerCase();

    // 1. 未返信3日以上 (For this demo, just check if it's unread and > 3 days)
    if (!msg.is_read && daysAgo >= 3) {
      reason = "unread_3_days";
    }
    // 2. 重要ラベル
    else if (msg.labels && msg.labels.includes("IMPORTANT")) {
      reason = "important";
    }
    // 3. 会議依頼
    else if (/meeting|invitation|会議|打ち合わせ/i.test(subjectLower)) {
      reason = "meeting";
    }
    // 4. 期限付き依頼
    else if (/due|deadline|期限|まで/i.test(subjectLower) || /due|deadline|期限|まで/i.test(snippetLower)) {
      reason = "deadline";
    }

    if (reason) {
      insights.push({
        id: msg.id,
        gmailId: msg.gmail_id,
        subject: msg.subject,
        fromEmail: msg.from_email,
        reason,
        snippet: msg.snippet,
        receivedAt: msg.received_at,
      });
    }

    if (insights.length >= 5) break;
  }

  return insights;
}
