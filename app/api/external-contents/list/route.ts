import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const road = searchParams.get("road");
    const type = searchParams.get("type");

    // 2. Build where filter
    const where: any = {};
    if (road) {
      where.road = road;
    }
    if (type) {
      where.type = type;
    }

    // 3. Fetch from ExternalContent (mapped to external_contents)
    const contents = await prisma.externalContent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error("Failed to list external contents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
