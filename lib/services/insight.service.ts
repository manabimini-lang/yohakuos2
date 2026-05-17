/**
 * ルールベースのインサイト生成
 * AI分析ではなく、単純な集計から「柔らかいひとこと」を返す。
 * 断定禁止・KPI化禁止・スコア禁止。
 */

export interface LogForInsight {
  moodTag: string | null;
  inputText: string;
  createdAt: Date;
}

export interface Insight {
  message: string;
}

const POSITIVE_TAGS = ["少し前進したい", "整えたい"];
const HEAVY_TAGS = ["疲れた", "不安", "焦る"];

export function generateInsight(logs: LogForInsight[]): Insight | null {
  if (logs.length < 3) return null;

  const moodCounts: Record<string, number> = {};
  for (const log of logs) {
    if (log.moodTag) {
      moodCounts[log.moodTag] = (moodCounts[log.moodTag] || 0) + 1;
    }
  }

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  // 最近5件と前の5件でmoodTagを比較
  const recent = logs.slice(0, Math.min(5, logs.length));
  const older = logs.slice(Math.min(5, logs.length), Math.min(10, logs.length));

  const recentHeavy = recent.filter(l => l.moodTag && HEAVY_TAGS.includes(l.moodTag)).length;
  const olderHeavy = older.filter(l => l.moodTag && HEAVY_TAGS.includes(l.moodTag)).length;

  const recentPositive = recent.filter(l => l.moodTag && POSITIVE_TAGS.includes(l.moodTag)).length;
  const olderPositive = older.filter(l => l.moodTag && POSITIVE_TAGS.includes(l.moodTag)).length;

  // ここに戻ってきたこと自体を評価する
  if (logs.length >= 10) {
    if (recentHeavy < olderHeavy && older.length > 0) {
      return {
        message: "最近、少し重い言葉が減っているかもしれません。",
      };
    }

    if (recentPositive > olderPositive && older.length > 0) {
      return {
        message: "最近、前に進もうとする気持ちが少し増えているかもしれません。",
      };
    }
  }

  // よく使うタグから柔らかいひとことを生成
  if (topMood) {
    const [tag, count] = topMood;
    const ratio = Math.round((count / logs.length) * 100);

    if (HEAVY_TAGS.includes(tag) && ratio >= 50) {
      return {
        message: `「${tag}」という感覚が続いているようです。無理しなくて大丈夫です。`,
      };
    }

    if (POSITIVE_TAGS.includes(tag) && ratio >= 40) {
      return {
        message: `「${tag}」という気持ちで来てくれる日が多いようです。`,
      };
    }
  }

  // デフォルト：ただここに来てくれていることへの言葉
  if (logs.length >= 5) {
    return {
      message: "書けない日があっても、ここに戻ってこれれば十分です。",
    };
  }

  return null;
}
