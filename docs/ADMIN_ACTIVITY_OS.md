# YOHAKU Activity OS

管理画面を、運用監視だけでなく「問い・知識・配信・製品改善・活動発信」を循環させるワークスペースとして利用するための初期実装です。

## 画面

- `/admin/activity`: 知識循環ハブ。各領域の件数と最近のアイテムを確認します。
- `/admin/newsletter`: メルマガ企画の下書き、対象セグメント、目的を管理します。
- `/admin/product-learning`: 匿名インサイトと製品仮説を登録します。
- `/admin/reports`: 活動レポートの下書きと既存のコミュニティ集約データを確認します。

## 二次利用の安全条件

インサイトは作成時に `anonymizationStatus=review_required` となり、公開前の人手レビューを必須にしています。`usagePurposes`、`consentStatus`、`minimumGroupSize` を残し、公開・配信の判断根拠を監査ログに記録します。

## データモデル

- `AdminInsight`: 匿名化された傾向・問い
- `NewsletterCampaign`: 配信前の企画と配信後の学び
- `ProductHypothesis`: 課題、仮説、成功指標、検証結果
- `ActivityReport`: 期間ごとの活動概要と公開状態

## 導入手順

1. `prisma/migrations/20260829_activity_os/migration.sql` を適用する
2. Prisma Client を生成する (`npx prisma generate`)
3. admin権限で上記画面を開く

外部メール配信サービスとの接続はこの段階では行わず、企画・承認・効果記録を先に整えます。
