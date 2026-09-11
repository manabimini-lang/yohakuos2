# 記事から登録・利用・課金への計測

2026-09-06

## 記録先と集計

既存Prisma AuditLog（audit_logs）のcategory=product_funnelに保存。DBスキーマ変更は不要。
管理者限定の /admin/acquisition で過去30日間のイベント件数を記事別に集計する。
売上は正のamount_paidがあるpaid請求書だけを対象とし、通貨別の最小単位で表示する。返金・手数料控除前で、利益やMRRではない。

## 正確な定義

- signup_completed: メール登録でDBにユーザーが作成された後、またはNextAuth createUserイベント。ログイン成功や開発用の仮アカウントは数えない。
- first_value_completed: /api/yui/actions/execute のrecommendationId分岐で、create_goalまたはcreate_milestoneの実保存と採用ステータス更新が成功した後の最初の1回。単なるAI応答、手動のメモ保存、仮実装のexecuteAction成功は対象外。すべての利用価値を網羅する指標ではない。
- payment_succeeded: 署名検証済みinvoice.payment_succeeded。初回・継続・その他をbilling_reasonで区別。0円・失敗・未決済は除外。

登録・初回利用はユーザーごとの固定ID、決済は請求書ごとの固定IDでupsertし、DBの一意性制約で並行処理・再送を重複排除する。
登録・利用時の計測失敗は警告ログを残し、本来の操作を妨げない。この場合は欠測となり自動復旧しない。
決済時の計測失敗はWebhookエラーとしてStripeの再送対象にする。既存の課金監査ログは今回の集計対象外。

## 記事情報とプライバシー

signupへのutm_source=yohaku_media、utm_medium=article、utm_content=記事slugを受け取る。slugは文字種と160文字以内に制限し、メールアドレス・パス・不正な値を除外。
HttpOnly・SameSite=Lax・本番Secure・30分期限のCookieでOAuth遷移にも引き継ぐ。Cookieには個人IDを入れない。
記事情報は入力値なので偽装可能。認証・認可・割引・課金額の根拠には使用しない。メディア側は公開slugの許可リストを使うが、本体側の検証は形式のみ。
登録成功時に記事情報をアカウントの監査ログと関連付け、その後の利用・決済は登録時の記事で集計する。既存利用者・直接登録・期限切れはunattributed。
メモ本文・メール本文・APIキーは計測ログに保存しない。プライバシーポリシーへ取得と利用目的を追記。

## 公開後に必要な確認

コード検証では外部DBへの書き込み、実アカウント作成、決済を行っていない。
テスト環境でメール登録・Google新規登録・採用保存・Stripeテスト請求書と同一通知再送を確認する。
本番Webhookがinvoice.payment_succeededを受け取る設定を確認する。新旧Stripe invoice.subscriptionとinvoice.parent.subscription_details.subscriptionに対応。
管理画面はイベント発生期間での集計であり、同一登録コホートの転換率ではない。最大10,000件で超過時は明示する。
メディア側のVercel Analyticsから得る閲覧・クリック数と記事slugで比較する。両集計の自動取り込みは未実装。

## 本番確認記録（2026-09-07）

- `article-20260907` を `utm_content` に付けた登録画面で、30分・HttpOnly・Secureの帰属Cookieが設定されることを確認した。
- 同じ経路で新規メール登録を実行し、`/admin/acquisition` に `article-20260907 / 登録完了 1` として記録されることを確認した。
- 既存の管理者アカウントで、YUI Chatの `create_goal` 提案を採用した後、`移動元不明・直接登録 / 初回利用 1` として記録されることを確認した。
- 同じ新規登録アカウントで、テスト用の `create_goal` 提案を採用済みにして目標を保存し、`first_value_completed` が `article-20260907` として1件記録されることを確認した。登録・目標保存・提案採用・初回価値イベントはいずれも同じユーザーIDで照合した。
- ブラウザでは既存の管理者アカウントについて、通常の提案実行APIから目標が保存されることを確認した。新規登録アカウントのブラウザログインは自動操作環境の入力制限があるため、同アカウントの保存・採用・計測連携は本番と同じサービス／DB操作で検証した。
