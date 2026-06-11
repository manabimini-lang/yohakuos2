import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
/**
 * Sprint E-4G: Audit Endpoint
 * Provides internal diagnostics for the Reflective Resurfacing Layer.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [totalResurfacings, avgDailyGenerationResult, latestGenerated] = await Promise.all([
      prisma.memoryResurfacing.count(),
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count, DATE_TRUNC('day', "created_at") as day
        FROM memory_resurfacings
        WHERE "created_at" >= NOW() - INTERVAL '7 day'
        GROUP BY day
        ORDER BY day DESC
      `,
      prisma.memoryResurfacing.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

    const averageDailyGeneration =
      avgDailyGenerationResult.length > 0
        ? avgDailyGenerationResult.reduce(
            (sum: number, r: { count: number }) => sum + r.count,
            0
          ) / avgDailyGenerationResult.length
        : 0;

    return NextResponse.json({
      totalResurfacings,
      pendingCount: {
        supported: false,
        reason: "MemoryResurfacing model does not expose a 'status' field."
      },
      dismissedCount: {
        supported: false,
        reason: "MemoryResurfacing model does not expose a 'feedback' field."
      },
      meaningfulCount: {
        supported: false,
        reason: "MemoryResurfacing model does not expose a 'feedback' field."
      },
      averageDailyGeneration: parseFloat(averageDailyGeneration.toFixed(2)),
      latestGeneratedAt: latestGenerated?.createdAt?.toISOString() || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AUDIT_RESURFACING_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
