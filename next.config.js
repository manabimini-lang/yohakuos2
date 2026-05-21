/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // すべてのAPIルートを動的にする（next-auth/cookies/headers使用ルートのビルドエラー回避）
  experimental: {
    fetchCache: 'default-no-store',
  },
  images: {
    domains: [
      'localhost',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'img.youtube.com',
      'i.ytimg.com',
    ],
  },
  // ビルド時に環境変数が未設定でもエラーにならないようフォールバックを設定
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'build-time-placeholder-secret-32chars!!',
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'build-time-placeholder-secret-32chars!!',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'https://yohakuos2.vercel.app',
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
