# YOHAKU Calm Infrastructure Layer — アーキテクチャ設計書

> バージョン: 1.0.0  
> 前提モデル: Gemini 3.1 Pro Low  
> 設計思想: 長く静かに存在できる知的基盤

---

## 1. Calm Infrastructure Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│    Life OS (10 pages) │ Ambient (1 page) │ Calm UX      │
│    GentleCard │ ConfidenceBadge │ StatCard              │
├──────────────────────────────────────────────────────────┤
│               Infrastructure Layer (lib/calm/)           │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────┐     │
│  │Cost        │ │Context       │ │Reflection      │     │
│  │Governance  │ │Lifecycle     │ │Safety          │     │
│  └────────────┘ └──────────────┘ └────────────────┘     │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────┐     │
│  │Queue       │ │Frequency     │ │Trust           │     │
│  │Governance  │ │Governance    │ │Layer           │     │
│  └────────────┘ └──────────────┘ └────────────────┘     │
├──────────────────────────────────────────────────────────┤
│  Integration: lib/lifeos/ ←→ lib/ambient/ ←→ lib/calm/   │
├──────────────────────────────────────────────────────────┤
│  Prisma ORM + PostgreSQL (50 models, 0 calm-specific)     │
└──────────────────────────────────────────────────────────┘
```

### 既存システムとの統合

| Layer | 統合点 | 方法 |
|-------|--------|------|
| Life OS + Ambient | AI Cost Governance | `shouldExecuteJob()` が全ジョブの実行を制御 |
| Life OS + Ambient | Context Lifecycle | `optimizeContext()` が全データを圧縮/削除 |
| Companion | Reflection Safety | `validateReflection()` が全AI出力を検証 |
| Life OS + Ambient | Queue Governance | `shouldProcessJob()` が優先度+コスト制御 |
| Ambient | Frequency Governance | `shouldSuppressAppearance()` が出現頻度制御 |
| UI全体 | Calm UX | GentleCard/ConfidenceBadgeで統一表示 |

---

## 2. AI Cost Governance

### 月間予算設計

| 項目 | 値 | 備考 |
|------|-----|------|
| 月間予算 | $5.00/全ユーザー | Gemini 3.1 Pro Low想定 |
| 1ユーザーあたり | $0.05/月 | 100ユーザーまで安全圏 |
| 日次予算 | $0.167 | 月間予算の1/30 |
| 低優先度抑制率 | 50% | 予算逼迫時は低優先度ジョブを抑制 |
| 節約モード発動 | 予算使用率70%超 | 自動的にトークン節約モードへ移行 |

### ジョブ優先度マップ

| 優先度 | 値 | 該当ジョブ |
|--------|-----|-----------|
| CRITICAL | 100 | 予約（将来の緊急ジョブ用） |
| HIGH | 50 | emotional_cooldown_update |
| MEDIUM | 20 | weekly_reflection, meaning_extraction |
| LOW | 10 | seasonal_reflection, life_balance_analysis, ambient_reflection, conversation_summary |
| BACKGROUND | 0 | memory_compression, conversation_compression, resonance_detection, slow_feed_cleanup |

### コスト抑制アルゴリズム

1. ジョブ実行前に `shouldExecuteJob()` でコストチェック
2. 予算超過 = 即時却下
3. 日次予算不足 = 却下
4. 低優先度 + 日次80%超過 = 抑制
5. ジョブ完了時 `recordJobCost()` で実際のコスト記録

---

## 3. Context Lifecycle Management

### ライフサイクル設定

| 設定 | 値 | 説明 |
|------|-----|------|
| 最大保存期間 | 365日 | 1年経過メモリは圧縮対象 |
| 低確度圧縮間隔 | 30日 | confidence < 0.4 は30日ごとに圧縮 |
| 長期サマリー保持数 | 12 | 最大12件の長期サマリーを維持 |
| 自動アーカイブ日数 | 90日 | 90日経過システムメッセージは削除 |
| 最小圧縮単位 | 5件 | 5件未満のタイプは圧縮しない |

### 最適化プロセス

```
optimizeContext(userId)
├── compressOldMemories()
│   ├── 30日以上前 + confidence < 0.4 のメモリを抽出
│   ├── タイプ別にグループ化（3件以上）
│   ├── AIで圧縮サマリー生成
│   └── 圧縮メモリを作成（confidence=0.25）
├── summarizeOldReflections()
│   ├── 90日以上前の内省を抽出（10件以上）
│   ├── AIでテーマ別要約
│   └── LifeReflectionとして保存
└── cleanupOldMessages()
    └── 90日以上前のsystemメッセージを削除
```

---

## 4. Reflection Safety Layer

### 6種の禁止カテゴリ（12の禁止パターン）

| カテゴリ | 重要度 | 例 |
|---------|--------|-----|
| 精神診断風 | high | 「HSP」「ADHD」「うつ病」「トラウマ」 |
| 人格断定 | high | 「あなたは〜タイプです」「間違いなく〜」 |
| 過剰プレッシャー | high | 「すべき」「しないと」「今すぐ」 |
| 依存誘導 | high | 「毎日報告してください」「私に任せて」 |
| 恐怖誘導 | high | 「このままだと危険」「気づかないと後悔」 |
| 過剰最適化 | medium | 「生産性を上げるべき」「効率を改善」 |

### 検証プロセス

```
validateReflection(reflection)
├── checkReflectionSafety(title)
├── checkReflectionSafety(content)
├── 違反検出 → マスク処理（【****】）
├── ensureUncertaintyWording() で断定表現を軟化
├── 違反ペナルティ: confidence -= 違反数 × 0.1
└── isOverGuiding() で過度な指示を検出（2パターン以上）
```

### Uncertainty Wording

8種類の接頭辞をランダムに使用:
- 「感じるのですが、」
- 「もしかすると、」
- 「一つの見方として、」
- 「ご自身の感覚が最も大切ですが、」
- 「よかったら考えてみてください。」
- 「少し違う角度から見ると、」
- 「データからは〜のように見えますが、」
- 「あくまで参考ですが、」

---

## 5. Queue Infrastructure Governance

### スタールジョブリカバリー

1時間以上 `processing` 状態のジョブを自動リカバリー:
- `recoverStalledJobs()` — 1時間経過した processing ジョブを pending に戻す
- retryCountをインクリメント
- エラーメッセージに「自動リカバリー」を記録
- 最大リトライ回数 = 3（既存の maxRetries 設定に準拠）

### 低優先度ジョブの頻度制御

`shouldProcessJob()`:
- `LOW` 優先度以下: 同じジョブタイプが60分以内に完了していたらスキップ
- コストチェックも同時実行

### キュー健康状態

`getQueueHealth()`:
- pending: 待機中ジョブ数
- processing: 実行中ジョブ数
- failed: 失敗ジョブ数
- completed: 完了ジョブ数
- stalledJobs: スタールジョブ数

---

## 6. Ambient Frequency Governance

### 沈黙ウィンドウ

22:00〜06:00 は強制的に沈黙。
全てのAI出現を抑制。

### 4層の抑制

```
Layer 1: Quiet Mode（手動設定）
Layer 2: Silence Window（22:00-06:00 自動）
Layer 3: Emotional Cooldown（強度5以上で抑制）
Layer 4: Overload Prevention（1日最大3回まで）
```

---

## 7. Trust Layer

### explainable AI

`explainInsight()` で10種のインサイトタイプに対応した説明文を提供:
- 「このテーマは以前から繰り返し現れています」
- 「まだ答えが出ていない問いがありそうです」
- 「長期的に関心を持ち続けているテーマです」

### confidence display

`getConfidenceLabel()` で4段階表示:

| 確度 | ラベル | 説明 |
|------|--------|------|
| >= 0.7 | 高い確度 | 複数のデータが一致しています |
| >= 0.5 | 確度あり | ある程度の根拠があります |
| >= 0.3 | 兆し | 弱いシグナルですが注目しています |
| < 0.3 | 小さな兆し | まだ確かなことではありません |

### 低確度免責事項

`getLowConfidenceDisclaimer()`:
- confidence < 0.3: 「まだ小さな兆しです...」
- confidence < 0.5: 「一つの可能性として見てください...」

---

## 8. Calm UX System

### デザイン原則

- **Whitespace-first**: 十分な余白（sm=12px, md=20px, lg=32px）
- **Low contrast stress**: Stone系カラー (50-700) で統一
- **Minimal transitions**: duration-500ms の静かな変化
- **Soft loading**: font-light + 低彩度
- **思考の余白**: 断定しない表現、確度の可視化

### コンポーネント

| コンポーネント | 用途 |
|--------------|------|
| GentleCard | ベースカード（3段階パディング） |
| StatCard | 統計表示（ラベル+値） |
| CalmEmptyState | 空状態表示（アイコン+メッセージ） |
| ConfidenceBadge | 確度表示（4段階ドット+ラベル） |
| LowConfidenceNote | 低確度注意書き |

---

## 9. Observability / Monitoring

### 推奨モニタリング項目

| 指標 | 取得方法 | アラート条件 |
|------|---------|-------------|
| 月間AIコスト | getCostReport().monthly.used | 月間予算の80%超過 |
| 日次AIコスト | getCostReport().daily.used | 日次予算超過 |
| スタールジョブ数 | getQueueHealth().stalledJobs | 1件以上 |
| キュー滞留数 | getQueueHealth().pending | 50件以上 |
| コンテキスト肥大 | getContextHealth().estimatedTokens | 100万トークン以上 |
| 安全違反 | checkReflectionSafety().violations | high severity 1件以上 |
| 出現頻度 | getFrequencyReport().todayCount | 最大値の80%以上 |
| 圧縮候補数 | getContextHealth().compressionCandidates | 100件以上 |

### 障害時対応

| 障害 | 影響範囲 | 復旧方法 |
|------|---------|---------|
| AI API障害 | 意味抽出/バランス/季節/Ambient | フォールバック実装済み（全エンジン） |
| DB障害 | 全機能 | Prisma接続プール/リトライ |
| 予算超過 | 低優先度ジョブ | 自動抑制 + 通知 |
| スタールジョブ | 非同期処理 | recoverStalledJobs() 自動実行 |
| コンテキスト肥大 | パフォーマンス | optimizeContext() 定期実行 |

---

## 10. Multi-Layer AI Architecture（将来）

```
Layer 1: Fast Reflection（低コスト・高頻度）
  - companion chat response
  - quick pattern detection
  - Gemini Flash想定

Layer 2: Weekly Synthesis（中コスト・週次）
  - weekly reflection generation
  - meaning signal extraction
  - life balance analysis

Layer 3: Seasonal Meaning（中コスト・季節）
  - seasonal reflection
  - resonance pattern detection
  - long-term theme identification

Layer 4: Long-Term Life Memory（高コスト・年次）
  - yearly life review
  - deep semantic analysis
  - identity evolution tracking
```

### Future Distributed Workers

現在のアーキテクチャは単一キューだが、
`JOB_PRIORITY_MAP` と `shouldProcessJob()` により、
将来的な分散ワーカーへの移行が容易。

```
現在: AIJob Queue → processNextJob() → handler
将来: AIJob Queue → priority worker pool → distributed handler
```

---

## 11. 移行注意点

```bash
# このフェーズでは Prisma マイグレーションは不要
# （既存テーブルのみ使用、新しいモデルは追加なし）
```

- 全機能が既存テーブル（AIJob, UserMemory, Reflection, CompanionMessage, EmotionalCooldown, AmbientInsight）のみで動作
- lib/calm/ は pure TypeScript（Prisma呼び出しはあるが、既存モデルのみ）
- components/calm/ はクライアントコンポーネント（'use client'）

---

## 12. Production 運用注意点

### コスト試算（Calm Infrastructure自体の追加コスト）

| 機能 | トークン数/回 | 頻度 | 月間コスト |
|------|-------------|------|-----------|
| compressOldMemories | ~500 | 月1回/ユーザー | ~$0.0002 |
| summarizeOldReflections | ~500 | 月1回 | ~$0.0002 |
| **合計追加コスト** | | | **~$0.0004/月/ユーザー** |

ほとんどの機能はAI呼び出しを行わない（ヒューリスティック+DBのみ）。

### 定期実行推奨

```typescript
// 日次実行
await recoverStalledJobs();

// 週次実行（全ユーザー）
for (const userId of activeUsers) {
    await optimizeContext(userId);
}
```

### デプロイ前チェックリスト

- [ ] lib/calm/ の全エクスポート確認
- [ ] components/calm/ の 'use client' 確認
- [ ] 既存AIJob Queueとの優先度競合確認
- [ ] 沈黙ウィンドウ設定確認（デフォルト22:00-06:00）
- [ ] 月間予算設定確認（デフォルト$5.00）