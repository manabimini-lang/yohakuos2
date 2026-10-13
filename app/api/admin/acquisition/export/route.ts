import { auth } from '@/lib/auth';
import { isAdminAccessEmail } from '@/lib/auth/admin-access';
import { extractPermissionsFromSession, hasMinRoleLevel } from '@/lib/permissions/helpers';
import { prisma } from '@/lib/prisma';
import { validArticle } from '@/lib/analytics/attribution';

export const dynamic = 'force-dynamic';

const actions = ['signup_completed', 'first_value_completed', 'payment_succeeded', 'subscription_canceled'] as const;

function jstStart(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const utc = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) return null;
  return new Date(`${value}T00:00:00+09:00`);
}

export async function GET(request: Request) {
  const session = await auth();
  const permissions = session ? extractPermissionsFromSession(session) : null;
  if (!session?.user || !isAdminAccessEmail(session.user.email) || !permissions || !hasMinRoleLevel(permissions.roles, 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const startText = url.searchParams.get('start');
  const endText = url.searchParams.get('end');
  const start = jstStart(startText);
  const end = jstStart(endText);
  if (!start || !end || end < start || end.getTime() - start.getTime() >= 31 * 86400000) {
    return Response.json({ error: 'Choose a valid range of up to 31 days.' }, { status: 400 });
  }
  const endExclusive = new Date(end.getTime() + 86400000);
  const records = await prisma.auditLog.findMany({
    where: { category: 'product_funnel', action: { in: [...actions] }, createdAt: { gte: start, lt: endExclusive } },
    select: { action: true, metadata: true },
    take: 10001,
  });
  if (records.length > 10000) {
    return Response.json({ error: 'Too many events to export completely. Choose a shorter period.' }, { status: 409 });
  }

  const totals = new Map<string, { event: string; source_article: string; count: number; currency?: string; amount_minor?: number }>();
  for (const record of records) {
    const metadata = record.metadata as Record<string, unknown> | null;
    const source = validArticle(metadata?.source_article) || 'unattributed';
    const currency = record.action === 'payment_succeeded' && typeof metadata?.currency === 'string'
      ? metadata.currency.toLowerCase() : undefined;
    if (record.action === 'payment_succeeded' && (!currency || !/^[a-z]{3}$/.test(currency))) continue;
    const key = `${record.action}:${source}:${currency ?? ''}`;
    const row = totals.get(key) ?? { event: record.action, source_article: source, count: 0 };
    row.count++;
    if (currency) {
      row.currency = currency;
      row.amount_minor = (row.amount_minor ?? 0) + (typeof metadata?.amount_minor === 'number' && Number.isSafeInteger(metadata.amount_minor) && metadata.amount_minor > 0 ? metadata.amount_minor : 0);
    }
    totals.set(key, row);
  }

  const body = JSON.stringify({
    period: { start: startText, end: endText, timezone: 'Asia/Tokyo' },
    events: [...totals.values()].sort((a, b) => a.source_article.localeCompare(b.source_article) || a.event.localeCompare(b.event)),
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="yohaku-os-funnel-${startText}-${endText}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
