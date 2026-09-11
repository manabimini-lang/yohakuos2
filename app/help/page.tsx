import Link from "next/link";

export const metadata = { title: "使い方" };

export default function HelpPage() {
  return <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
    <Link href="/yui" className="text-sm underline">ホームへ戻る</Link>
    <header className="space-y-3"><h1 className="text-3xl font-semibold">YOHAKUの使い方</h1><p>気になることを残して、今日やることを1つ決め、結果を振り返るための場所です。AIアシスタントの名前はYUIです。</p></header>
    <section className="space-y-3"><h2 className="text-xl font-semibold">まずはメモを1つ残しましょう</h2><p>ホーム右下の「＋」→「メモを保存」を押します。「今日は10分読書できた」など一文を入力して保存してください。AIやGoogleの接続は不要です。</p><p>保存した内容はホームの「最近の記録」で見返せます。</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">1. 気になることを相談する</h2><p>ホーム上部の入力欄に「今日は30分使えます。片付けと読書のどちらから始めるか、一緒に考えて」と書き、「YUIに相談する」を押します。</p><p>PremiumはAPIキーの設定が不要です。無料プランでAI相談を使う場合は、ご自身のGeminiまたはGroq APIキーを登録・有効化します。Groqは文章生成向けで、写真整理と記憶の類似検索にはGeminiを使います。設定後もメモと相談は別々に使えます。</p><Link href="/yui/settings#ai" className="inline-block underline">AI設定を開く</Link></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">2. 今日やることを決める</h2><p>「目的とマイルストーン」から目的を登録します。目的カードの「＋ 次のタスクを追加」で小さな行動を追加し、終えたらそのタスクの「完了」を押します。マイルストーンは、目的に向けた小さなタスクのことです。</p><p>Googleカレンダーの連携は任意です。予定を相談すると、YUIはまず内容を提案します。登録は提案内容を確認してから実行してください。</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">3. 結果を振り返る</h2><p>目的カードの「振り返りを記録」で、できたことや気づきを残します。次のタスクも入力できます。保存後は「最近の記録」で確認してください。</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">メモ・相談・AIが覚える情報の違い</h2><ul className="list-disc space-y-2 pl-5"><li>メモ：自分の記録として保存します。AIの返答は付きません。</li><li>相談：YUIの返答とともに会話履歴に残ります。</li><li>今後の提案に使う：会話から見つかった情報を、AIが継続して参照する記憶として採用します。</li></ul></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">よくある迷い</h2><p>Google未接続のときは、予定がないと判断できません。接続後に情報を取得してください。通知は現在、ホーム上の朝晩のまとめとして表示されます。</p><p>AI設定の確認に失敗したら、設定画面で接続テストを行ってください。AIを使わなくてもメモ・タスク・振り返りは保存できます。</p></section>
    <Link href="/yui" className="inline-block rounded-xl bg-slate-900 px-5 py-3 text-white">ホームで始める</Link>
  </main>;
}
