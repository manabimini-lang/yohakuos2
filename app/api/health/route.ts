import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const DATABASE_TIMEOUT_MS = 3_000;

export async function GET() {
  const startedAt = Date.now();

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database health check timed out")), DATABASE_TIMEOUT_MS),
      ),
    ]);

    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[HEALTH_CHECK_ERROR]", error);
    return NextResponse.json(
      {
        status: "unavailable",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
