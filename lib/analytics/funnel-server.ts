import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ARTICLE_COOKIE, validArticle } from './attribution';
import { eventId, paidInvoice, writeEvent } from './funnel-events';

async function signupSource(userId: string): Promise<string> {
  const signup = await prisma.auditLog.findUnique({ where: { id: eventId('signup_completed', userId) }, select: { metadata: true } });
  const metadata = signup?.metadata as { source_article?: unknown } | null;
  return validArticle(metadata?.source_article) || 'unattributed';
}

export async function recordSignup(userId: string, method: 'email' | 'oauth') {
  try {
    const source = validArticle(cookies().get(ARTICLE_COOKIE)?.value) || 'unattributed';
    await writeEvent(prisma.auditLog, 'signup_completed', userId, userId, source, { method });
  } catch {
    // Account creation must still succeed if analytics is unavailable.
    console.warn('[product-funnel] signup event could not be saved');
  }
}

export async function recordFirstValue(userId: string) {
  try {
    const source = await signupSource(userId);
    await writeEvent(prisma.auditLog, 'first_value_completed', userId, userId, source, { definition: 'persisted_recommendation_accepted' });
  } catch {
    console.warn('[product-funnel] first value event could not be saved');
  }
}

export async function recordPayment(userId: string, invoice: any, stripeEventId: string) {
  const payment = paidInvoice(invoice);
  if (!payment) return;
  const source = await signupSource(userId);
  // Deliberately propagate DB failure: Stripe retries the signed webhook.
  await writeEvent(prisma.auditLog, 'payment_succeeded', invoice.id, userId, source, { ...payment, stripe_event_id: stripeEventId });
}
