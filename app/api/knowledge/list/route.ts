import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  noStore();
  try {
    // 1. Verify NextAuth session (authenticates the user in alignment with RLS)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract road filter from query params if present
    const { searchParams } = new URL(req.url);
    const road = searchParams.get("road");

    // 3. Query shared_knowledge table (Supabase Postgres) via Prisma
    const knowledgeList = await prisma.sharedKnowledge.findMany({
      where: road ? { road } : {},
      orderBy: {
        createdAt: "desc", // Newest first
      },
    });

    return NextResponse.json(knowledgeList);
  } catch (error) {
    console.error("Failed to fetch knowledge:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
