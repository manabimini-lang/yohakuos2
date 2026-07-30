import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    const target = getSupabaseAdmin();
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export type YuiUnifiedAction = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  source: "rule1" | "rule2" | "rule3" | "rule4";
  actionType:
    | "reply_email"
    | "schedule_meeting"
    | "create_goal"
    | "create_timeblock"
    | "create_reflection";
  payload: Record<string, unknown>;
};

export async function getUnifiedActions(userId: string): Promise<YuiUnifiedAction[]> {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const _3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Fetch Calendar Events (Today ~ 7 days)
  const { data: calendarEvents } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_at", now.toISOString())
    .lte("start_at", next7Days.toISOString());

  // Fetch Gmail Messages
  const { data: gmailMessages } = await supabaseAdmin
    .from("gmail_messages")
    .select("*")
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .limit(100);

  const actions: YuiUnifiedAction[] = [];
  if (!gmailMessages) return actions;

  const events = calendarEvents || [];

  for (const msg of gmailMessages) {
    const receivedTime = new Date(msg.received_at).getTime();
    const isUnread = !msg.is_read;
    const isImportant = msg.labels && msg.labels.includes("IMPORTANT");
    const subjectLower = msg.subject.toLowerCase();
    const snippetLower = msg.snippet.toLowerCase();
    const hasDeadline = /due|deadline|期限|まで/i.test(subjectLower) || /due|deadline|期限|まで/i.test(snippetLower);
    
    // Check if there is a meeting with the sender
    let isFromOrganizer = false;
    let hasMeeting = false;
    for (const ev of events) {
      const evDesc = ev.description?.toLowerCase() || "";
      const evTitle = ev.title?.toLowerCase() || "";
      if (msg.from_email && (evDesc.includes(msg.from_email.toLowerCase()) || ev.metadata?.googleHtmlLink)) {
        // Simplified check: assume if email is in description, they might be an organizer
        isFromOrganizer = true;
      }
      if (evTitle.includes("meeting") || evTitle.includes("会議") || evTitle.includes("打ち合わせ")) {
        hasMeeting = true;
      }
    }

    // Rule 1: 会議主催者から未返信メール
    if (isUnread && isFromOrganizer) {
      actions.push({
        id: `rule1_${msg.id}`,
        title: `会議関連の未返信メールがあります`,
        description: `件名: ${msg.subject}`,
        priority: "high",
        source: "rule1",
        actionType: "reply_email",
        payload: { gmailId: msg.gmail_id, toEmail: msg.from_email },
      });
      continue; // Only one rule per msg for simplicity
    }

    // Rule 2: 期限付きメール + 予定なし
    if (hasDeadline && !hasMeeting) {
      actions.push({
        id: `rule2_${msg.id}`,
        title: `期限付きのメールに対応する予定を確保してください`,
        description: `件名: ${msg.subject}`,
        priority: "high",
        source: "rule2",
        actionType: "create_timeblock",
        payload: { gmailId: msg.gmail_id },
      });
      continue;
    }

    // Rule 3: 重要メール + 会議あり
    if (isImportant && hasMeeting) {
      actions.push({
        id: `rule3_${msg.id}`,
        title: `重要なメールと関連する会議が控えています`,
        description: `件名: ${msg.subject}`,
        priority: "medium",
        source: "rule3",
        actionType: "schedule_meeting",
        payload: { gmailId: msg.gmail_id },
      });
      continue;
    }

    // Rule 4: 3日以上未返信
    if (isUnread && receivedTime < _3DaysAgo.getTime()) {
      actions.push({
        id: `rule4_${msg.id}`,
        title: `3日以上未返信のメールがあります`,
        description: `件名: ${msg.subject}`,
        priority: "medium",
        source: "rule4",
        actionType: "reply_email",
        payload: { gmailId: msg.gmail_id, toEmail: msg.from_email },
      });
      continue;
    }
  }

  // Sort by priority (high > medium > low)
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  actions.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return actions.slice(0, 5);
}
