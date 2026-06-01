import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DATABASE_URLが未設定でもビルド時にクラッシュしないようにする
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("[prisma] DATABASE_URL is required for runtime initialization.");
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const host = parsedUrl.hostname;
    const port = parsedUrl.port || (parsedUrl.protocol === "postgresql:" ? "5432" : "");
    console.log(`[PRISMA_RUNTIME_URL] host=${host} port=${port}`);
  } catch (error) {
    console.log("[PRISMA_RUNTIME_URL] failed to parse DATABASE_URL");
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
