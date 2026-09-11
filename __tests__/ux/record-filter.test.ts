import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReplyCharLimit, fitReplyToCharLimit, getGoalSchedulePreferenceAdjustment, isJapanesePublicHoliday, isMemoryCandidateContent, isTestContent, isUserActivity } from '../../lib/yui-ux.ts';

test('test consultations and acknowledgements do not become memory candidates', () => {
  for (const text of ['はい、承知いたしました', 'ありがとうございます。', '【動作検証20260907】これは架空の相談です']) {
    assert.equal(isMemoryCandidateContent(text), false);
  }
  assert.equal(isMemoryCandidateContent('平日は趣味の時間が取れないので土日に回したい'), true);
  assert.equal(isMemoryCandidateContent('ありがとうございます。来週までに資料を準備したい'), true);
});
test('internal activity is hidden while user records remain', () => {
  assert.equal(isTestContent('【動作検証】最初の価値計測'), true);
  assert.equal(isTestContent('ビデオ映像創作展'), false);
  assert.equal(isUserActivity({ event_type: 'ai_request' }), false);
  assert.equal(isUserActivity({ event_type: 'memory_candidate_created' }), false);
  assert.equal(isUserActivity({ event_type: 'calendar_action_scheduled' }), false);
  assert.equal(isUserActivity({ event_type: 'calendar_action_rejected' }), false);
  assert.equal(isUserActivity({ event_type: 'recommendation_created', title: 'カレンダー登録: 【動作検証】確認' }), false);
  assert.equal(isUserActivity({ event_type: 'conversation', content: '回答', metadata: { role: 'assistant' } }), false);
  assert.equal(isUserActivity({ event_type: 'conversation', content: '【動作検証20260907】架空です', metadata: { role: 'user' } }), false);
  assert.equal(isUserActivity({ event_type: 'conversation_created', content: '来週までに資料を作る', metadata: { role: 'user' } }), true);
});

test('explicit Japanese character limits are detected and enforced', () => {
  assert.equal(extractReplyCharLimit('理由を添えて100字以内で提案して'), 100);
  assert.equal(extractReplyCharLimit('10文字以下で'), 10);
  assert.equal(extractReplyCharLimit('短く答えて'), null);
  const reply = fitReplyToCharLimit('はい、承知いたしました。机を5分片付けましょう。視界が整い、残り時間で読書を始めやすくなります。', 30);
  assert.ok(Array.from(reply).length <= 30);
  assert.equal(reply.startsWith('はい'), false);
});

test('weekday preferences defer matching hobbies but not unrelated goals', () => {
  const preferenceTexts = ['平日は趣味にかける時間がありません。土日祝日に回してください。'];
  const monday = new Date('2026-09-07T03:00:00.000Z');
  const saturday = new Date('2026-09-12T03:00:00.000Z');

  assert.equal(getGoalSchedulePreferenceAdjustment({
    goalTitle: 'バイクのメンテナンス', preferenceTexts, now: monday, timeZone: 'Asia/Tokyo',
  }).scoreDelta, -80);
  assert.equal(getGoalSchedulePreferenceAdjustment({
    goalTitle: '新学期準備', preferenceTexts, now: monday, timeZone: 'Asia/Tokyo',
  }).scoreDelta, 0);
  assert.equal(getGoalSchedulePreferenceAdjustment({
    goalTitle: 'バイクのメンテナンス', preferenceTexts, now: saturday, timeZone: 'Asia/Tokyo',
  }).scoreDelta, 0);
});

test('a directly named goal can have its own weekday preference', () => {
  const result = getGoalSchedulePreferenceAdjustment({
    goalTitle: 'ビデオ映像創作展',
    preferenceTexts: ['ビデオ映像創作展は平日には進めない。週末に回す。'],
    now: new Date('2026-09-07T03:00:00.000Z'),
    timeZone: 'Asia/Tokyo',
  });
  assert.equal(result.scoreDelta, -80);
});

test('Japanese public holidays and substitute holidays are not treated as workdays', () => {
  assert.equal(isJapanesePublicHoliday('2026-09-21'), true);
  assert.equal(isJapanesePublicHoliday('2026-09-22'), true);
  assert.equal(isJapanesePublicHoliday('2026-05-06'), true);
  assert.equal(isJapanesePublicHoliday('2026-09-07'), false);

  const result = getGoalSchedulePreferenceAdjustment({
    goalTitle: 'バイクのメンテナンス',
    preferenceTexts: ['平日は趣味にかける時間がありません。土日祝日に回してください。'],
    now: new Date('2026-09-21T03:00:00.000Z'),
    timeZone: 'Asia/Tokyo',
  });
  assert.equal(result.scoreDelta, 0);
});
