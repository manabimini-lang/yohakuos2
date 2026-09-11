<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# YOHAKU

YOHAKUはVercelで公開するWebサービスです。npmパッケージとして配布するものではありません。

`package.json` は `private: true` に設定されており、誤って `npm pack` を実行しても、この案内ファイル以外のアプリ本体・テスト・作業用ファイルは含めません。

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `MANAGED_GEMINI_API_KEY` in `.env.local` for Premium AI. This is a
   server-only secret and must never use the `NEXT_PUBLIC_` prefix. Free users
   can use AI only with the Gemini API key they register themselves.
   Premium audio generation uses a separate server-only `GOOGLE_TTS_API_KEY`
   restricted to the Google Cloud Text-to-Speech API.
3. Run the app:
   `npm run dev`
