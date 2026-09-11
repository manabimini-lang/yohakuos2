/** Returns true only for messages that are suitable for a human follow-up suggestion. */
export function isActionableHumanEmail(input: { fromEmail?: string | null; subject?: string | null; labels?: unknown }) {
  const from = (input.fromEmail ?? "").toLowerCase();
  const subject = (input.subject ?? "").toLowerCase();
  const labels = Array.isArray(input.labels) ? input.labels.map(String) : [];

  const isAutomatedSender = /(?:no-?reply|do-?not-?reply|notifications?|alerts?|mailer-daemon)@|\bno-?reply\b/i.test(from);
  const isSecurityNotice = /two[- ]?factor|\b2fa\b|security alert|password|login attempt|認証|セキュリティ|パスワード|ログイン/.test(subject);
  const isPromotional = labels.includes("CATEGORY_PROMOTIONS") || labels.includes("CATEGORY_SOCIAL");

  return !isAutomatedSender && !isSecurityNotice && !isPromotional;
}
