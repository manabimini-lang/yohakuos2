import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isActionableHumanEmail } from "./email_safety";

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

export type YuiUnifiedActionFeedback = "helpful" | "dismissed";
export type YuiUnifiedActionDismissReason = "busy" | "not_relevant" | "later";

export async function saveUnifiedActionFeedback(
  userId: string,
  actionId: string,
  feedback: YuiUnifiedActionFeedback,
  dismissReason?: YuiUnifiedActionDismissReason,
) {
  const { data, error } = await supabaseAdmin
    .from("yui_unified_action_feedback")
    .upsert(
      {
        user_id: userId,
        action_id: actionId,
        feedback,
        dismiss_reason: dismissReason ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,action_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getUnifiedActions(userId: string): Promise<YuiUnifiedAction[]> {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch Calendar Events (Today ~ 7 days)
  const { data: calendarEvents } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gte("start_at", now.toISOString())
    .lte("start_at", next7Days.toISOString());

  // Fetch Gmail Messages
  const { data: gmailMessages } = await supabaseAdmin
    .from("gmail_messages")
    .select("*")
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .limit(100);

  const { data: feedbackRows, error: feedbackError } = await supabaseAdmin
    .from("yui_unified_action_feedback")
    .select("action_id, feedback")
    .eq("user_id", userId);
  if (feedbackError) {
    // Keep recommendations available until the optional feedback table is migrated.
    console.warn("Failed to load unified action feedback", feedbackError.message);
  }
  const dismissedActionIds = new Set(
    (feedbackRows ?? []).filter((row) => row.feedback === "dismissed").map((row) => row.action_id),
  );
  const helpfulActionIds = new Set(
    (feedbackRows ?? []).filter((row) => row.feedback === "helpful").map((row) => row.action_id),
  );

  const actions: YuiUnifiedAction[] = [];
  if (!gmailMessages) return actions;

  const events = calendarEvents || [];

  for (const msg of gmailMessages) {
    if (!isActionableHumanEmail({ fromEmail: msg.from_email, subject: msg.subject, labels: msg.labels })) {
      continue;
    }
    const isImportant = msg.labels && msg.labels.includes("IMPORTANT");
    const subjectLower = msg.subject.toLowerCase();
    const snippetLower = msg.snippet.toLowerCase();
    const hasDeadline = /due|deadline|期限|まで/i.test(subjectLower) || /due|deadline|期限|まで/i.test(snippetLower);
    
    let hasMeeting = false;
    for (const ev of events) {
      const evTitle = ev.title?.toLowerCase() || "";
      if (evTitle.includes("meeting") || evTitle.includes("会議") || evTitle.includes("打ち合わせ")) {
        hasMeeting = true;
      }
    }

    // An unread message is not evidence that a reply is required. Replying
    // needs a user decision, so YUI only proposes non-communicative planning
    // actions from email signals.

    // Rule 1: 期限付きメール + 予定なし
    if (hasDeadline && !hasMeeting) {
      actions.push({
        id: `rule1_${msg.id}`,
        title: `期限付きのメールに対応する予定を確保してください`,
        description: `件名: ${msg.subject}`,
        priority: "high",
        source: "rule1",
        actionType: "create_timeblock",
        payload: { gmailId: msg.gmail_id },
      });
      continue;
    }

    // Rule 2: 重要メール + 会議あり
    if (isImportant && hasMeeting) {
      actions.push({
        id: `rule2_${msg.id}`,
        title: `重要なメールと関連する会議が控えています`,
        description: `件名: ${msg.subject}`,
        priority: "medium",
        source: "rule2",
        actionType: "schedule_meeting",
        payload: { gmailId: msg.gmail_id },
      });
      continue;
    }

  }

  // Sort by priority (high > medium > low)
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  actions.sort((a, b) => {
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return Number(helpfulActionIds.has(b.id)) - Number(helpfulActionIds.has(a.id));
  });

  return actions.filter((action) => !dismissedActionIds.has(action.id)).slice(0, 5);
}
