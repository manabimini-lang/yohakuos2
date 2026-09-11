/** Shared display rules for goals, old system replies, and time proposals. */
export function goalProgress(progress: number, milestones: { status: string }[]) {
  return Math.max(progress || 0, milestones.length ? Math.round(milestones.filter(item => item.status === 'completed').length / milestones.length * 100) : 0);
}

export function isSystemReply(content: string) {
  return /^(AI接続がまだ設定されていないか、無効になっています|APIキーが見つかりません|すみません、少し考えがまとまりませんでした)/.test(content.trim());
}

export function isTestContent(content: string | null | undefined) {
  return /【(?:動作検証|UX検証)|これは架空の相談/.test(content ?? '');
}

export function isMemoryCandidateContent(content: string) {
  const text = content.trim();
  return Boolean(text) && !isSystemReply(text)
    && !isTestContent(text)
    && !/^(?:はい[、,]?\s*)?(?:承知(?:いた)?しました|ありがとうございます)[。！!]?\s*$/.test(text);
}

export function isUserActivity(event: {
  event_type: string;
  title?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (['ai_request', 'memory_candidate_created'].includes(event.event_type)) return false;
  if (event.event_type.startsWith('calendar_action_')) return false;
  if (isTestContent(`${event.title ?? ''} ${event.content ?? ''}`)) return false;
  if (['conversation', 'conversation_created'].includes(event.event_type)) {
    if (event.metadata?.role === 'assistant') return false;
    if (event.content && !isMemoryCandidateContent(event.content)) return false;
  }
  return true;
}

export function extractReplyCharLimit(message: string) {
  const match = message.match(/([1-9]\d{0,3})\s*(?:字|文字)\s*(?:以内|以下)/);
  if (!match) return null;
  const limit = Number(match[1]);
  return limit >= 10 && limit <= 2000 ? limit : null;
}

export function fitReplyToCharLimit(reply: string, maxChars: number) {
  const text = reply.trim();
  if (Array.from(text).length <= maxChars) return text;

  const withoutAcknowledgement = text.replace(
    /^(?:はい[、,]?\s*)?(?:承知(?:いた)?しました|ありがとうございます|ご相談ありがとうございます)[。！!]\s*/,
    '',
  );
  if (Array.from(withoutAcknowledgement).length <= maxChars) return withoutAcknowledgement;

  const clipped = Array.from(withoutAcknowledgement).slice(0, maxChars).join('');
  const sentenceEnd = Math.max(clipped.lastIndexOf('。'), clipped.lastIndexOf('！'), clipped.lastIndexOf('？'));
  if (sentenceEnd >= Math.floor(maxChars * 0.6)) return clipped.slice(0, sentenceEnd + 1).trim();
  if (maxChars === 1) return '…';
  return `${Array.from(clipped.trimEnd()).slice(0, maxChars - 1).join('')}…`;
}

const HOBBY_TERMS = [
  '趣味', '余暇', 'プライベート', 'バイク', 'ツーリング', 'ゲーム', 'キャンプ',
  '釣り', '旅行', '音楽', 'スポーツ', '読書', 'diy',
];

function holidayKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function nthMonday(year: number, month: number, occurrence: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (8 - first.getUTCDay()) % 7;
  return 1 + offset + (occurrence - 1) * 7;
}

export function isJapanesePublicHoliday(dateKey: string) {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  if (year < 2000 || year > 2099) return false;

  const holidays = new Set<string>();
  const add = (month: number, day: number) => holidays.add(holidayKey(year, month, day));
  add(1, 1);
  add(1, nthMonday(year, 1, 2));
  add(2, 11);
  add(2, 23);
  add(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  add(7, nthMonday(year, 7, 3));
  add(8, 11);
  add(9, nthMonday(year, 9, 3));
  add(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(10, nthMonday(year, 10, 2));
  add(11, 3);
  add(11, 23);

  // A weekday between two national holidays is also a holiday.
  for (let day = new Date(Date.UTC(year, 0, 2)); day.getUTCFullYear() === year; day.setUTCDate(day.getUTCDate() + 1)) {
    const key = holidayKey(year, day.getUTCMonth() + 1, day.getUTCDate());
    if (holidays.has(key)) continue;
    const previous = new Date(day); previous.setUTCDate(previous.getUTCDate() - 1);
    const next = new Date(day); next.setUTCDate(next.getUTCDate() + 1);
    if (holidays.has(holidayKey(year, previous.getUTCMonth() + 1, previous.getUTCDate()))
      && holidays.has(holidayKey(year, next.getUTCMonth() + 1, next.getUTCDate()))) holidays.add(key);
  }

  // A Sunday holiday is observed on the next day that is not already a holiday.
  for (const key of [...holidays].sort()) {
    const date = new Date(`${key}T00:00:00.000Z`);
    if (date.getUTCDay() !== 0) continue;
    const substitute = new Date(date);
    do substitute.setUTCDate(substitute.getUTCDate() + 1);
    while (holidays.has(holidayKey(year, substitute.getUTCMonth() + 1, substitute.getUTCDate())));
    if (substitute.getUTCFullYear() === year) {
      holidays.add(holidayKey(year, substitute.getUTCMonth() + 1, substitute.getUTCDate()));
    }
  }
  return holidays.has(dateKey);
}

export function getGoalSchedulePreferenceAdjustment(input: {
  goalTitle: string;
  goalDescription?: string | null;
  preferenceTexts: string[];
  now?: Date;
  timeZone?: string;
}) {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone ?? 'Asia/Tokyo';
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(now);
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const zonedDateKey = ['year', 'month', 'day'].map(type => dateParts.find(part => part.type === type)?.value).join('-');
  const isJapaneseHoliday = timeZone === 'Asia/Tokyo' && isJapanesePublicHoliday(zonedDateKey);
  if (weekday === 'Sat' || weekday === 'Sun' || isJapaneseHoliday) return { scoreDelta: 0, reason: null };

  const goalTitle = input.goalTitle.trim().toLocaleLowerCase();
  const goalText = `${input.goalTitle} ${input.goalDescription ?? ''}`.toLocaleLowerCase();
  const isHobbyGoal = HOBBY_TERMS.some(term => goalText.includes(term));

  for (const source of input.preferenceTexts) {
    const text = source.trim().toLocaleLowerCase();
    const avoidsWeekdays = /平日[\s\S]{0,45}(?:ない|ません|避け|難し|できず|できない|進めない|しない)/.test(text)
      || /(?:土日|週末|休日|祝日)[\s\S]{0,30}(?:回して|回す|行う|する|だけ)/.test(text);
    if (!avoidsWeekdays) continue;

    const explicitlyNamesGoal = goalTitle.length >= 2 && text.includes(goalTitle);
    const describesHobbyPreference = /趣味/.test(text) && isHobbyGoal;
    if (explicitlyNamesGoal || describesHobbyPreference) {
      return {
        scoreDelta: -80,
        reason: explicitlyNamesGoal
          ? `「${input.goalTitle}は平日を避ける」という希望を反映しています。`
          : '「趣味は土日・休日に回す」という希望を反映しています。',
      };
    }
  }

  return { scoreDelta: 0, reason: null };
}

export function isFutureInterval(start: string, end: string, now = Date.now()) {
  const from = Date.parse(start), to = Date.parse(end);
  return Number.isFinite(from) && Number.isFinite(to) && from > now && to > from;
}
