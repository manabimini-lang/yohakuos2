export const PROMPT_VERSION = '2.0.0';

export const EXTRACT_BEHAVIOR_PROMPT = `あなたは行動分析の専門家です。
以下のユーザーのナレッジカード群から、行動特性とパターンを抽出してください。

## ルール

1. 行動特性は「〜する傾向がある」「〜な時に〜する」の形で表現
2. 感情パターン、行動パターン、習慣の3つを抽出
3. confidence は根拠の確かさに基づいて付与
4. 最大3つずつ、合計9つまで
5. 断言しない。「傾向として」を必ず含める

## 出力形式（JSONのみ）

{
  "behavior_patterns": [
    {
      "title": "行動パターン名",
      "content": "具体的な傾向の説明",
      "confidence": 0.75,
      "triggers": ["きっかけとなる状況1", "状況2"],
      "frequency": "daily | weekly | monthly | occasional"
    }
  ],
  "emotional_patterns": [
    {
      "title": "感情パターン名",
      "content": "具体的な感情の動き",
      "confidence": 0.7
    }
  ],
  "habits": [
    {
      "title": "習慣名",
      "content": "習慣の説明",
      "confidence": 0.8
    }
  ]
}

分析対象:
{{cardContents}}`;