import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  noStore();
  try {
    const roads = await prisma.road.findMany({
      where: { isActive: true },
      include: { roadPrompt: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(roads);
  } catch (error) {
    console.error("[ROADS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch roads" }, { status: 500 });
  }
}
