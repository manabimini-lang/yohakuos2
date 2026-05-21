import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // 2. Fetch target knowledge
    const knowledge = await prisma.sharedKnowledge.findUnique({
      where: { id },
    });

    if (!knowledge) {
      return NextResponse.json({ error: "Knowledge not found" }, { status: 404 });
    }

    // 3. Fetch related knowledge (up to 3, prioritize same road, excluding current)
    let related = await prisma.sharedKnowledge.findMany({
      where: {
        road: knowledge.road,
        NOT: { id },
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we have fewer than 3 items from the same road, fetch from other roads to backfill
    if (related.length < 3) {
      const needed = 3 - related.length;
      const excludeIds = [id, ...related.map((r) => r.id)];
      const additional = await prisma.sharedKnowledge.findMany({
        where: {
          NOT: {
            id: {
              in: excludeIds,
            },
          },
        },
        take: needed,
        orderBy: {
          createdAt: "desc",
        },
      });
      related = [...related, ...additional];
    }

    return NextResponse.json({ knowledge, related });
  } catch (error) {
    console.error("Failed to fetch knowledge detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
