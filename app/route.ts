import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Sprint E-3F: Memory Audit Endpoint
 * Provides internal diagnostics for the Semantic Memory Layer.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [totalItems, embeddedItems, memoryLinks, avgSimilarity] = await Promise.all([
      prisma.contentItem.count(),
      prisma.contentItem.count({ where: { NOT: { embedding: null } } }),
      prisma.memoryLink.count(),
      prisma.memoryLink.aggregate({ _avg: { similarity: true } }),
    ]);

    const indexCheck: any[] = await prisma.$queryRaw`
      SELECT indexname FROM pg_indexes WHERE indexname = 'content_items_embedding_idx'
    `;

    return NextResponse.json({
      totalContentItems: totalItems,
      embeddedItems,
      memoryLinks,
      averageSimilarity: avgSimilarity._avg.similarity || 0,
      vectorIndexExists: indexCheck.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AUDIT_MEMORY_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}