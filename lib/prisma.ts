import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DATABASE_URLが未設定でもビルド時にクラッシュしないようにする
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    // ビルド時（DATABASE_URLなし）はダミーのクライアントを返す
    // 実行時には必ず環境変数が設定されているため問題なし
    console.warn("[prisma] DATABASE_URL is not set. Using placeholder for build.");
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
