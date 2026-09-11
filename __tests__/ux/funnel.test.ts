import assert from 'node:assert/strict';
import test from 'node:test';
import { articleFromParams, validArticle } from '../../lib/analytics/attribution.ts';
import { eventId, invoiceSubscriptionId, paidInvoice, writeEvent } from '../../lib/analytics/funnel-events.ts';

test('accepts article campaigns, rejects unrelated sources and private query values', () => {
  assert.equal(articleFromParams(new URLSearchParams('utm_source=yohaku_media&utm_medium=article&utm_content=article-123')), 'article-123');
  assert.equal(articleFromParams(new URLSearchParams('utm_source=other&utm_medium=article&utm_content=article-123')), null);
  for (const value of ['email@example.com', '../file', 'a'.repeat(161), null, '']) assert.equal(validArticle(value), null);
});

test('event identity distinguishes lifecycle types and deduplicates invoice retries', async () => {
  const records = new Map<string, unknown>();
  const store = { async upsert(args: any) { if (!records.has(args.where.id)) records.set(args.where.id, args.create); } };
  await Promise.all([1, 2, 3].map(() => writeEvent(store, 'payment_succeeded', 'in_test', 'user_test', 'article-123', { amount_minor: 980, currency: 'jpy' })));
  assert.equal(records.size, 1);
  assert.notEqual(eventId('signup_completed', 'user_test'), eventId('first_value_completed', 'user_test'));
  const saved = [...records.values()][0] as any;
  assert.equal(saved.metadata.source_article, 'article-123');
  assert.equal(saved.metadata.amount_minor, 980);
});

test('unpaid, failed and zero-value invoices are not revenue', () => {
  for (const [status, amount_paid] of [['open', 980], ['paid', 0], ['paid', -1]]) {
    assert.equal(paidInvoice({ id: 'in_test', status, amount_paid, currency: 'jpy' }), null);
  }
  assert.equal(paidInvoice({ id: 'in_test', status: 'paid', amount_paid: 980, currency: 'jpy', billing_reason: 'subscription_create' })?.payment_kind, 'initial');
  assert.equal(paidInvoice({ id: 'in_test', status: 'paid', amount_paid: 980, currency: 'jpy', billing_reason: 'subscription_cycle' })?.payment_kind, 'renewal');
});

test('subscription extraction supports both old and current Stripe invoice layouts', () => {
  assert.equal(invoiceSubscriptionId({ subscription: 'sub_old' }), 'sub_old');
  assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_new' } } }), 'sub_new');
  assert.equal(invoiceSubscriptionId({}), null);
});

test('payment storage failures are visible to the webhook retry mechanism', async () => {
  const store = { async upsert() { throw new Error('database unavailable'); } };
  await assert.rejects(writeEvent(store, 'payment_succeeded', 'in_test', 'u', 'unattributed'), /database unavailable/);
});
