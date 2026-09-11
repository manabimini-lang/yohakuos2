export type FunnelEvent = 'signup_completed' | 'first_value_completed' | 'payment_succeeded';
export const eventId = (event: FunnelEvent, key: string) =>
  `funnel_${event}_${key}`;

export function invoiceSubscriptionId(invoice: any): string | null {
  const value = invoice.subscription ?? invoice.parent?.subscription_details?.subscription;
  return typeof value === 'string' ? value : value?.id || null;
}

export function paidInvoice(invoice: any) {
  if (!invoice.id || invoice.status !== 'paid' || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid <= 0) return null;
  if (typeof invoice.currency !== 'string' || !/^[a-z]{3}$/.test(invoice.currency)) return null;
  return {
    amount_minor: invoice.amount_paid as number,
    currency: invoice.currency as string,
    payment_kind: invoice.billing_reason === 'subscription_create' ? 'initial'
      : invoice.billing_reason === 'subscription_cycle' ? 'renewal' : 'other',
  };
}

export async function writeEvent(store: { upsert(args: any): Promise<unknown> }, event: FunnelEvent, key: string, userId: string, source: string, details: Record<string, string | number> = {}) {
  // Database uniqueness makes webhook retries and simultaneous requests idempotent.
  return store.upsert({
    where: { id: eventId(event, key) },
    update: {},
    create: {
      id: eventId(event, key), actorId: userId, category: 'product_funnel',
      action: event, targetType: 'user', targetId: userId, severity: 'info',
      metadata: { ...details, source_article: source, product: 'yohaku' },
    },
  });
}
