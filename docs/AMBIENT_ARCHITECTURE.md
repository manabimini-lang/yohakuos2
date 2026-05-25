# YOHAKU Ambient Intelligence Layer — アーキテクチャ設計書

> バージョン: 1.0.0  
> 前提モデル: Gemini 3.1 Pro Low  
> 設計思想: 静かな知的環境（ユーザーが操作するAIではない）

---

## 1. Ambient Intelligence Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer (app/ambient)                │
│  Slow Feed │ Resonance Patterns │ Quiet Insights       │
├─────────────────────────────────────────────────────────┤
│              Ambient Engine (lib/ambient/)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐           │
│  │Presence  │ │Resonance │ │Contextual    │            │
│  │System    │ │Engine    │ │Surfacing     │            │
│  └──────────┘ └──────────┘ └──────────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐           │
│  │Slow Feed │ │Calm Rec  │ │Frequency     │            │
│  │          │ │ommend    │ │Control       │            │
│  └──────────┘ └──────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────┤
│              Integration Layer                          │
│  Life OS (lib/lifeos/) ←→ Companion (lib/companion/)   │
├─────────────────────────────────────────────────────────┤
│         Prisma ORM + PostgreSQL (50 models total)       │
└─────────────────────────────────────────────────────────┘
```

### 既存システムとの統合

```
Life OS Layer ←→ Ambient Intelligence Layer
  ─ areas.ts     ─ presence.ts (出現条件にリフレクション停滞を使用)
  ─ energy.ts    ─ presence.ts (感情反復の検出)
  ─ meaning.ts   ─ resonance.ts (意味シグナルからパターン検出)
  ─ seasonal.ts  ─ contextual-surface.ts (季節エコー)

Companion Layer ←→ Ambient Intelligence Layer
  ─ silence.ts   ─ presence.ts (共通クールダウンシステム)
  ─ ethics.ts    ─ prompts.ts (共通倫理ルール)
  ─ boundary.ts  ─ presence.ts (shouldSurface = 共通出現制御)
```

---

## 2. Prisma Schema — 新規3モデル

| モデル | 用途 | 主要フィールド |
|--------|------|--------------|
| AmbientInsight | 環境知性インサイト | type, title, content, sourceMemoryIds, confidence, surfacedAt, dismissedAt |
| ResonancePattern | 人生の反復パターン | patternType, description, confidence, observedCount, firstObservedAt, lastObservedAt |
| SlowFeedEntry | 低速知性フィード | entryType, title, content, isRead, isSaved, priority, surfacedAt |

### モデル間の関係

```
User
  ├── AmbientInsight (1:N) — 静かに現れるインサイト
  ├── ResonancePattern (1:N) — 検出された反復パターン
  └── SlowFeedEntry (1:N) — 低速知性フィードエントリー
```

---

## 3. Quiet Presence System

### 設計思想

AIは常に喋らない。常に提案しない。常に最適化しない。

### 出現条件（4種類）

| 条件 | 検出方法 | 推奨インサイトタイプ |
|------|---------|-------------------|
| Reflection Stagnation | 3日以上内省がない | quiet_discovery |
| Emotional Repetition | 同じ感情パターンが4回以上継続 | theme_recurrence |
| Meaning Signal Accumulation | 意味シグナル2件以上蓄積 | reflection_bridge |
| Seasonal Timing | 3/6/9/12月の季節変わり目 | seasonal_echo |

### Frequency Control（3層）

```
Layer 1: Global Frequency
  - 最低インターバル: 4時間
  - 1日最大出現数: 3回
  - 低確度抑制: confidence < 0.25 は抑制

Layer 2: Type Cooldown
  - 同じタイプの再出現: 24時間クールダウン
  - Emotional Cooldown連携: 強度5以上は強制抑制

Layer 3: Quiet Periods
  - リフレクションが活発な期間は抑制
  - エネルギーが安定している期間は抑制
```

---

## 4. Memory Resonance Engine

### 検出する5つの反復パターン

| パターン種別 | 説明 | 使用データ |
|-------------|------|-----------|
| seasonal_recurrence | 季節ごとに繰り返すテーマ | 季節サマリー × 8 |
| emotional_cycle | 感情の循環パターン | エネルギー状態 × 365日 |
| behavioral_loop | 行動パターンの反復 | UserMemory |
| thematic_return | 同じテーマへの回帰 | MeaningSignal |
| value_consistency | 価値観の一貫性 | DirectionReflection |

### 検出プロセス

1. 長期データ収集（90日〜1年）
2. 月別エネルギー分布の集計
3. 既存パターンとの重複チェック
4. AIによるパターン検出（JSON出力）
5. 結果をDB保存 + 重複防止
6. 同じパターン再検出時は observedCount を increment

### 断面禁止ルール

- 「あなたはいつも同じ間違いをします」禁止
- ネガティブな固定観念の強化禁止
- 変更を強制する示唆禁止

---

## 5. Contextual Surfacing

### 現在の文脈の取得

```typescript
interface SurfaceContext {
    currentTheme: string | null;       // 最新の意味シグナル
    currentEmotion: string | null;     // 最新のエネルギー状態
    activeRoad: string | null;         // 現在のRoad
    currentSeason: string | null;      // 春/夏/秋/冬
    recentReflections: number;         // 直近の内省数
    recentEnergies: string[];          // 直近のエネルギー状態
    lastInsightAt: Date | null;        // 最後のインサイト時刻
}
```

### 静かなレコメンデーション

| type | 説明 | 例 |
|------|------|-----|
| connection | 現在と過去の繋がり | 「この記録は今のテーマと繋がっているかもしれません」 |
| space | 思考の余白 | 「何か心に浮かぶことがあれば、それが今日のテーマかもしれません」 |
| question | 静かな問い | 「この感覚、以前も似たようなことがありましたか？」 |
| reflection | 内省のきっかけ | 「最近の学びで、心に残っているものはありますか？」 |
| echo | 過去のエコー | 「去年の今頃も、似たようなことを考えていましたね」 |

---

## 6. Slow Intelligence Feed

### SNS Feed との対比

| 要素 | SNS Feed | Slow Intelligence Feed |
|------|---------|----------------------|
| 頻度 | リアルタイム | 1日数回（最大3回） |
| 文脈 | 浅い | 深い（人生の繋がり） |
| 目的 | エンゲージメント | 静かな気づき |
| 強制 | 無限スクロール | 見ても見なくても良い |
| 報酬 | ドーパミンループ | 内省の余白 |
| 削除 | 30日以上経過した既読エントリーは自動削除 |

### エントリータイプ

```
insight          — 環境知性による気づき（優先度: confidenceベース）
resonance        — 人生の反復パターン（優先度: observedCountベース）
reflection       — システム生成の内省（優先度: 中）
seasonal_echo    — 季節のこだま（優先度: 季節変わり目に高）
quiet_connection — 静かな接続（優先度: 低）
```

---

## 7. 統合キュー戦略

| ジョブタイプ | 頻度 | トリガー | 優先度 |
|------------|------|---------|--------|
| ambient_reflection | 4時間ごと | 定期スケジュール | 低 |
| resonance_detection | 週1回 | 定期スケジュール | 低 |
| slow_feed_cleanup | 日次 | 定期スケジュール | 最低 |
| weekly_reflection | 週1回 | 既存（Companion） | 中 |
| meaning_extraction | 週2回 | 既存（Life OS） | 中 |

### コスト管理

| 機能 | 推定トークン数/回 | 月間コスト想定 |
|------|----------------|--------------|
| ambient_reflection | ~1,000 | ~$0.003 |
| resonance_detection | ~2,000 | ~$0.001 |
| **合計追加コスト** | | **~$0.004/月/ユーザー** |

---

## 8. エンドレスフィード・ドーパミンループ防止

### 絶対禁止設計

```typescript
// lib/ambient/slow-feed.ts — 自動削除
export async function clearOldFeedEntries(userId: string): Promise<number> {
    // 30日以上経過した既読エントリーは自動削除
    // → 無限蓄積防止 = エンドレススクロール防止
}

// lib/ambient/presence.ts — 頻度制御
const DEFAULT_FREQUENCY_CONFIG: FrequencyConfig = {
    minIntervalHours: 4,    // 最低4時間あけない
    maxPerDay: 3,           // 1日最大3回
    lowConfidenceThreshold: 0.25,  // 低確度抑制
    typeCooldownHours: 24,  // 同じタイプは24時間あけない
};
```

### 依存防止設計

- **Push通知禁止**: 全てユーザーが能動的にアクセス
- **Streak表示禁止**: 連続記録日数などの報酬系なし
- **未読バッジのみ**: 優しい存在通知（強制ではない）
- **30日自動削除**: 溜め込み防止

---

## 9. Ethical Guardrails

| 禁止事項 | 理由 | 代替実装 |
|---------|------|---------|
| Notification addiction | ユーザー依存防止 | 静かな余白を維持 |
| Emotional manipulation | 倫理違反 | Uncertainty wording |
| Urgency loops | 不安誘導 | すべて「任意」として提示 |
| Streak pressure | 過剰自己改善 | 到達度表示なし |
| Engagement maximization | SNS化防止 | 30日自動削除 |

---

## 10. Future Ambient Computing 拡張

### 現在の設計で移行可能な点

```typescript
// 1. Voice Ambient AI
//    → lib/ambient/presence.ts の shouldSurface() を音声用に共有
//    → 出力先が画面→音声に変わるだけ

// 2. Wearable Integration
//    → EnergyState をウェアラブルデータに置換可能
//    → lib/ambient/contextual-surface.ts のデータソース差し替え

// 3. Multimodal Sensing
//    → AmbientInsight.sourceMemoryIds で任意のメディアを参照可能
//    → 型定義の拡張のみで対応

// 4. Semantic Life Replay
//    → ResonancePattern がライフリプレイの核データになる
//    → firstObservedAt → lastObservedAt で時系列再生

// 5. Calm Operating Environment
//    → Frequency Config を環境設定に応じて調整可能
//    → 現在: デフォルト4時間 → 将来: ユーザー設定可
```

### 拡張ロードマップ

```
Phase 1（今回）: Ambient Intelligence Layer — 静かな気づき/Feed
Phase 2（次回）:
  - Voice Ambient（音声による静かな出現）
  - Streaming Context（リアルタイム文脈反映）
  - Semantic Resonance（ベクトル類似による共鳴検出）
Phase 3（将来）:
  - Calm Operating Environment（環境全体の静かな知性化）
  - AI Reflective Spaces（物理空間との統合）
```

---

## 11. Migration 注意点

```bash
npx prisma migrate dev --name add_ambient_intelligence_layer
```

- 新規3モデルのみ追加（既存テーブルへの影響なし）
- Userモデルに3リレーション追加（Cascade削除）
- 全モデルに `@index` 完備
- ダウンタイムなし

---

## 12. Production 運用注意点

### コスト試算

Ambient Intelligence の追加コストは月間約$0.004/ユーザー。
Life OS Layer と合計しても月間約$0.03-0.05/ユーザー。

### モニタリング推奨項目

- `shouldSurface()` の出現/抑制比率
- Resonance パターンの重複検出率
- Slow Feed の既読率（高すぎ = 頻度が多すぎる可能性）
- 30日クリーンアップの削除数

### 障害時対応

1. AI API障害 → presence.ts はAI不要（ヒューリスティックのみ）
2. resonance.ts → 空結果返却
3. slow-feed.ts → キャッシュデータ表示
4. queue.ts → 再試行（maxRetries=3）