import assert from 'node:assert/strict';
import test from 'node:test';
import { goalProgress, isSystemReply, isFutureInterval } from '../../lib/yui-ux.ts';
import { getZonedTime } from '../../app/ui/backend/yui/timezone.ts';

test('completed tasks determine progress even when stored progress is zero', () => {
  assert.equal(goalProgress(0, [{status:'completed'}]), 100);
  assert.equal(goalProgress(0, [{status:'completed'}, {status:'pending'}]), 50);
  assert.equal(goalProgress(70, [{status:'completed'}, {status:'pending'}]), 70);
  assert.equal(goalProgress(15, []), 15);
});
test('system failures are excluded without excluding ordinary user content', () => {
  assert.equal(isSystemReply('AI接続がまだ設定されていないか、無効になっています。設定画面でGemini APIキーを登録してください。'), true);
  assert.equal(isSystemReply('APIキーが見つかりません。'), true);
  assert.equal(isSystemReply('接続について勉強したい'), false);
});
test('expired, malformed and reversed time slots cannot be actionable', () => {
  const now = Date.parse('2026-09-05T12:55:00Z');
  assert.equal(isFutureInterval('2026-09-05T00:00:00Z', '2026-09-05T09:00:00Z', now), false);
  assert.equal(isFutureInterval('invalid', 'invalid', now), false);
  assert.equal(isFutureInterval('2026-09-06T01:00:00Z', '2026-09-06T00:00:00Z', now), false);
  assert.equal(isFutureInterval('2026-09-06T00:00:00Z', '2026-09-06T00:30:00Z', now), true);
});
test('workday time uses the user timezone instead of the server timezone', () => {
  assert.equal(getZonedTime(new Date('2026-09-05T12:55:00Z'), 'Asia/Tokyo', 1, 9).toISOString(), '2026-09-06T00:00:00.000Z');
  assert.equal(getZonedTime(new Date('2026-03-07T18:00:00Z'), 'America/New_York', 1, 9).toISOString(), '2026-03-08T13:00:00.000Z');
});

import { findBestGap } from '../../app/ui/backend/yui/timezone.ts';
test('evening request offers tomorrow, never the elapsed workday', () => {
  const gap = findBestGap([], new Date('2026-09-05T12:55:00Z'), 30);
  assert.equal(gap?.start.toISOString(), '2026-09-06T00:00:00.000Z');
  assert.equal(gap?.minutes, 30);
});
test('overlapping meetings are respected and 30 minute gaps remain usable', () => {
  const events = [
    {start_at:'2026-09-06T00:00:00Z',end_at:'2026-09-06T01:00:00Z'},
    {start_at:'2026-09-06T00:30:00Z',end_at:'2026-09-06T01:30:00Z'},
    {start_at:'2026-09-06T02:00:00Z',end_at:'2026-09-06T09:00:00Z'},
  ];
  const gap = findBestGap(events, new Date('2026-09-05T12:55:00Z'), 30);
  assert.equal(gap?.start.toISOString(), '2026-09-06T01:30:00.000Z');
  assert.equal(gap?.end.toISOString(), '2026-09-06T02:00:00.000Z');
});
test('fully occupied search window does not invent an available fallback', () => {
  assert.equal(findBestGap([{start_at:'2026-09-01T00:00:00Z',end_at:'2026-10-01T00:00:00Z'}], new Date('2026-09-05T12:55:00Z'), 30), null);
});
