export const PROMPT_VERSION = '2.0.0';

export const EXTRACT_VALUES_PROMPT = `あなたは価値観分析の専門家です。
以下のユーザーのナレッジカード群から、コアバリュー（核となる価値観）を抽出してください。

## ルール

1. 価値観は「感謝」「挑戦」「調和」などの抽象名詞で表現
2. 各価値観に「その価値観が表れている行動や思考パターン」を記載
3. confidence は根拠の確かさに基づいて0.0~1.0で付与
4. 最大5つまで。本当にコアなものだけを抽出
5. 精神診断的な表現は一切禁止

## 出力形式（JSONのみ）

{
  "values": [
    {
      "title": "価値観名（2-4文字）",
      "content": "この価値観が表れている具体的なエピソードや行動パターン",
      "confidence": 0.85,
      "category": "growth | connection | stability | contribution | freedom"
    }
  ]
}

分析対象:
{{cardContents}}`;