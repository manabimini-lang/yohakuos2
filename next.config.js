/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  // ビルド時に環境変数が未設定でもエラーにならないようフォールバックを設定
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'build-time-placeholder-secret-32chars!!',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'https://yohakuos2.vercel.app',
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
};

module.exports = nextConfig;
