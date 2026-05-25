# YOHAKU Life OS Layer — アーキテクチャ設計書

> バージョン: 1.0.0  
> 前提モデル: Gemini 3.1 Pro Low  
> 設計思想: 人生の静かな知的OS（学習アプリでもAIチャットでもない）

---

## 1. Life OS Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│  Timeline │ Areas │ Meaning │ Energy │ Balance ... │
├─────────────────────────────────────────────────────┤
│              Life OS Engine (lib/lifeos/)           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Timeline│ │Areas│ │Meaning│ │Energy│ │Balance│    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Habit │ │Season│ │Quiet │ │Dir   │ │Comp  │      │
│  │Flow  │ │al    │ │Plan  │ │ection│ │ress  │      │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
├─────────────────────────────────────────────────────┤
│           Context Compression Layer                 │
│  Rolling │ Thematic │ Emotional │ Meaning │ Seasonal │
├─────────────────────────────────────────────────────┤
│              AI Service (lib/ai/gemini.ts)          │
├─────────────────────────────────────────────────────┤
│         Prisma ORM + PostgreSQL                     │
│  15 Life OS models + existing Memory/Companion      │
└─────────────────────────────────────────────────────┘
```

### レイヤー間のデータフロー

```
User Action → UI (Server Component) → Life OS Engine → AI Service → DB
                                                           ↓
                                              Context Compression (token節約)
                                                           ↓
                                              Prisma CRUD
```

### 全レイヤーの依存関係

- UI → Engine → Prisma (直接呼び出し)
- Engine → AI Service (意味抽出/バランス分析/季節振り返りのみ)
- Engine → Context Compression (全データ投入防止)
- Engine → Companion Boundary (共通AI出現制御)

---

## 2. Life Timeline 設計

### 統合データソース（8種）

| ソース | タイプ | 取得範囲 | フィルタ条件 |
|--------|--------|---------|------------|
| Reflection | reflection | 直近30日 | 全件 |
| UserMemory | learning/emotion | 直近30日 | confidence >= 0.3 |
| CompanionMessage | conversation | 直近30日 | role = "assistant" |
| LifeReflection | reflection | 直近30日 | areaType一致 |
| MeaningSignal | meaning | 直近30日 | confidence >= 0.2 |
| HabitFlow | habit | 直近30日 | updatedAt範囲 |
| EnergyState | energy | 直近30日 | 全件 |
| DirectionReflection | direction | 直近30日 | 全件 |

### ページネーション戦略

- Cursor-based pagination（カーソル=エントリーID）
- デフォルト30件、最大100件
- hasMoreフラグで継続判定

### トークン節約設計

- 全データ投入禁止
- descriptionは200字でカット
- 各ソースはeffectiveLimit（limit+1）のみ取得

---

## 3. Life Area 設計

### 8つの領域

| 領域 | ラベル | 説明 |
|------|--------|------|
| Health | 健康 | 身体と心の健康状態 |
| Learning | 学び | 知識・スキルの習得 |
| Work | 仕事 | 仕事・キャリア |
| Creativity | 創造 | 創造的な表現 |
| Relationships | 人間関係 | 人との繋がり |
| Mind | 心 | 内面の静けさ |
| Rest | 休息 | 休憩と回復 |
| Challenge | 挑戦 | 新たな挑戦 |

### アクティビティ集計

- 30日間のリフレクション数
- 30日間のエネルギー記録数
- 30日間の意味シグナル数
- 直近10件のエネルギー平均値

---

## 4. Meaning Layer 設計

### 5種の意味シグナル

| シグナル種別 | 説明 | 検出タイミング |
|-------------|------|--------------|
| recurring_theme | 繰り返し現れるテーマ | 週次AI抽出 |
| unresolved_question | 未解決の問い | 会話/リフレクション解析 |
| value_tension | 価値観の葛藤 | 行動パターン分析 |
| long_term_curiosity | 長期的好奇心 | 継続的関心の検出 |
| emotional_recurrence | 感情パターンの再帰 | エネルギー状態分析 |

### AI抽出プロセス

1. 直近7-30日のデータを収集
2. 3データポイント未満ならスキップ
3. AIにJSON形式で抽出を依頼
4. 結果をDB保存 + クライアント返却
5. パース失敗時は空結果（フォールバック）

### 分析機能

- シグナルをタイプ別にグループ化
- 2件以上でパターン認識
- 高確度シグナルから静かな問いを自動生成

---

## 5. Energy Engine

### 6つのエネルギー状態

| 状態 | 説明 | 典型的な状況 |
|------|------|------------|
| calm_focus | 静かな集中 | 没頭している時 |
| exhaustion | 疲弊 | 消耗している時 |
| recovery | 回復 | 休憩中/回復期 |
| curiosity | 好奇心 | 新しい発見があった時 |
| instability | 不安定 | 揺れている時 |
| groundedness | 地に足 | 安定している時 |

### トレンド分析アルゴリズム

1. 直近14日間のデータを収集
2. 平均強度を計算（1-10）
3. 最多出現状態を特定
4. 直近3件 vs それ以前3件を比較
5. 変化の兆しをテキスト生成

### 診断禁止ルール

- 「疲労障害」「燃え尽き症候群」など医療表現禁止
- 変化は「〜かもしれません」で表現
- データ不足 = 「十分なデータがありません」

---

## 6. Habit Flow 設計

### 4つの状態遷移

```
start → active → paused → active (再開)
                → completed (完了)
                → naturally_ended (自然消滅: 30日以上未更新)
```

### 30日ルール

- 30日以上更新がないactive習慣は自動で `naturally_ended` に遷移
- `detectNaturallyEndedHabits()` でバッチ処理

### habit tracker 化禁止

- 強度は1-5の大まかなスケールのみ
- 「連続記録日数」などのストリーク機能なし
- 「やるべき」の圧力をかけない

---

## 7. Prompt Layer

### 6つのシステムプロンプト

| プロンプト | 役割 | 使用シーン |
|-----------|------|-----------|
| MEANING_SYSTEM_PROMPT | 意味抽出 | meaning.ts |
| ENERGY_SYSTEM_PROMPT | エネルギー観察 | energy.ts (将来) |
| SEASONAL_SYSTEM_PROMPT | 季節振り返り | seasonal.ts |
| DIRECTION_SYSTEM_PROMPT | 方向性内省 | seasonal.ts |
| BALANCE_SYSTEM_PROMPT | バランス分析 | balance.ts |
| QUIET_PLANNING_SYSTEM_PROMPT | 静かな計画 | quiet-planning.ts |

### 共通倫理ルール（全プロンプト共通）

- 精神診断表現禁止
- 「〜すべき」「〜しなさい」禁止
- 恐怖/不安誘導禁止
- 過剰最適化禁止
- uncertainty強制

---

## 8. Context Compression

### 5方式の圧縮

| 方式 | 説明 | データソース |
|------|------|------------|
| Rolling Summary | 直近の出来事サマリー | Reflections + Messages |
| Thematic Compression | テーマ別圧縮 | UserMemories |
| Emotional Abstraction | 感情的抽象化 | EnergyStates + Reflections |
| Meaning Compression | 意味圧縮 | MeaningSignals |
| Seasonal Summarization | 季節サマリー | SeasonalSummary |

### トークン予算

- 1セクションあたり最大500トークン
- 全体で約2500トークン以内
- 圧縮コンテキストはCompanion Contextの代わりに利用可能

---

## 9. Ethical Guardrails

### 絶対禁止リスト

```typescript
// 禁止パターン（lib/lifeos/prompts.ts + lib/companion/ethics.ts）
- 精神診断: 「障害」「症候群」「病」「疾患」
- 断定: 「絶対に」「必ず」「間違いなく」
- 強制: 「すべき」「しなさい」
- 恐怖誘導: 「このままだと危険」「気づかないと」
- 依存誘導: 「私に任せて」「毎日報告して」
- 過剰最適化: 「生産性を上げる方法」
```

### Boundary Rules（共通ゲートウェイ）

```typescript
async function shouldRespond(userId: string): BoundaryDecision
async function shouldStaySilent(userId: string): BoundaryDecision  
async function shouldDefer(userId: string, context): BoundaryDecision
```

判定基準:
1. Emotional Cooldown チェック（強度7以上 = 強制沈黙）
2. 会話間隔チェック（最低2時間）
3. Reflection Cooldown チェック
4. 感情的内容 = 静かな内省へ委譲
5. 複雑な内省 = 振り返りエンジンへ委譲

---

## 10. UI 設計

### デザイン原則

- **カラーパレット**: Stone系 (50-700) — 静かで落ち着いた印象
- **フォント**: font-light — 軽やかで知的
- **余白**: max-w-5xl、十分なパディング
- **トーン**: 断定しない、評価しない、強制しない

### 全8ページ

| ページ | パス | 主要コンポーネント |
|--------|------|-------------------|
| タイムライン | /life/timeline | 統計カード + エントリーリスト |
| 人生領域 | /life/areas | 8領域グリッド + アクティビティ |
| 意味の兆し | /life/meaning | パターン + 静かな問い + シグナル一覧 |
| エネルギー | /life/energy | 統計 + トレンド + 状態一覧 |
| 季節振り返り | /life/seasonal | 現在季節 + サマリー + テーマ |
| バランス | /life/balance | 指標ゲージ + 兆し + 提案 |
| 静かな計画 | /life/planning | 3カラム提案 + 保存意図 |
| 方向性 | /life/direction | 方向性リフレクション一覧 |

### 空状態のデザイン

すべてのページに「まだデータがありません」状態を実装。
「記録を始めると表示されます」などの優しいガイダンス。

---

## 11. Future Ambient AI 拡張

### 現在の設計で移行可能な点

```typescript
// Boundary Rules は共通化済み
// → ambient AI / voice AI / passive AI でも同じ関数を使用可能
export async function shouldRespond(userId: string): BoundaryDecision
export async function shouldStaySilent(userId: string): BoundaryDecision
export async function shouldDefer(userId: string, context): BoundaryDecision
```

### 将来拡張ロードマップ

```
Phase 1（今回）: Life OS Layer — 静的観察/振り返り
Phase 2（次回）: 
  - Vector Memory（pgvector + 意味検索）
  - Multimodal Memory（画像/音声対応）
  - Ambient AI（定期的な静かな気づき）
Phase 3（将来）:
  - AI Mentor（人生の伴走者）
  - Semantic Life Retrieval（人生検索）
  - Voice Companion（音声対話）
  - Life Replay System（人生再生）
```

### 現在の設計での将来対応箇所

- `lib/lifeos/boundary.ts` — 共通AI出現制御（どのモードでも再利用可能）
- `lib/lifeos/compression.ts` — 圧縮抽象化（vector化時にEmbeddingに置換可能）
- `lib/lifeos/types.ts` — SeasonalPeriod等の型定義（拡張可能）
- Prisma schema — 全モデルに `@map` と `@index` 完備

---

## 12. Migration 注意点

### 初回マイグレーション

```bash
npx prisma migrate dev --name add_life_os_layer
```

### 注意点

1. **既存データへの影響**: 新規モデル追加のみ。既存テーブル非互換変更なし。
2. **Userモデル拡張**: 13のリレーションフィールドを追加（Cascade削除）。
3. **CompanionConversation拡張**: userリレーション追加（Cascade削除）。
4. **インデックス**: 全モデルに検索用インデックス完備。
5. **独自ID生成**: LifeAreaは `@@unique([userId, type])` で重複防止。
6. **ダウンタイム**: 新規テーブル追加のみのため、ダウンタイムなし。
7. **ロールバック**: `npx prisma migrate down` で可能。

---

## 13. Production 運用注意点

### コスト管理

| 機能 | 推定トークン数/回 | 月間想定回数 | 月間推定コスト |
|------|----------------|------------|--------------|
| 意味抽出 (extractMeaningSignals) | ~2,000 | 4回/週 = 16回 | ~$0.004 |
| 季節振り返り (generateSeasonalReflection) | ~1,500 | 4回/週 = 16回 | ~$0.003 |
| バランス分析 (analyzeLifeBalance) | ~1,500 | 2回/週 = 8回 | ~$0.002 |
| 静かな計画 (generateQuietSuggestions) | ~1,000 | オンデマンド | ~$0.001/回 |
| コンテキスト圧縮 (buildCompressedContext) | ~2,000 | 1回/日 = 30回 | ~$0.008 |

**合計**: 月間約$0.02-$0.05/ユーザー（Gemini 3.1 Pro Low想定）

### パフォーマンス最適化

1. **Server Component優先**: 全ページがServer Component
2. **Promise.all並列化**: 複数DBクエリを並列実行
3. **Cursor-based Pagination**: 大量データ時のOFFSET回避
4. **AI呼び出しは非同期キュー経由**: エンジン→Queue→非同期処理
5. **コンテキスト圧縮でトークン節約**: 全データ投入防止

### モニタリング推奨項目

- AIJob Queueの滞留状況 (status=processing長時間)
- 意味シグナル抽出の成功率 (JSONパース失敗率)
- バランス分析のフォールバック率 (AI失敗→ヒューリスティック)
- コンテキスト圧縮のトークン使用量

### 障害時対応

1. **AI API障害**: 各エンジンにフォールバック実装済み
   - balance.ts → heuristicBalanceAnalysis()
   - meaning.ts → 空結果返却
   - quiet-planning.ts → デフォルト提案返却
2. **DB障害**: Prismaのエラーハンドリングで対応
3. **トークン超過**: Context Compressionで自動調整

---

## 付録: ファイル構成

```
lib/lifeos/
├── types.ts              # 全型定義 + SeasonalPeriod utility
├── prompts.ts            # 6つのシステムプロンプト
├── timeline.ts           # 人生タイムラインエンジン
├── areas.ts              # 人生領域管理
├── meaning.ts            # 意味抽出エンジン
├── habit-flow.ts         # 習慣フロー管理
├── energy.ts             # エネルギー追跡
├── seasonal.ts           # 季節振り返り + 方向性リフレクション
├── balance.ts            # ライフバランス分析
├── quiet-planning.ts     # 静かな計画
├── compression.ts        # コンテキスト圧縮
├── boundary.ts           # 共通AI出現制御
├── conversation-compression.ts  # 会話圧縮
├── road.ts               # Road履歴管理
├── queue.ts              # 非同期ジョブ定義
└── index.ts              # 統一エクスポート

app/life/
├── layout.tsx            # Life OS専用レイアウト
├── page.tsx              # /life → /life/timeline redirect
├── timeline/page.tsx     # 人生タイムライン
├── areas/page.tsx        # 人生領域
├── meaning/page.tsx      # 意味の兆し
├── energy/page.tsx       # エネルギー
├── seasonal/page.tsx     # 季節振り返り
├── balance/page.tsx      # バランス
├── planning/page.tsx     # 静かな計画
└── direction/page.tsx    # 方向性