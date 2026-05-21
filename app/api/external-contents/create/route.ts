import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch full user to verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // 3. Parse and validate body
    const body = await req.json();
    const { title, url, thumbnailUrl, type, road, tags, description } = body;

    if (!title || !url || !type || !road) {
      return NextResponse.json(
        { error: "Missing required fields (title, url, type, road)" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["note", "youtube", "article", "discord", "app"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // 4. Create record
    const newContent = await prisma.externalContent.create({
      data: {
        title,
        url,
        thumbnailUrl: thumbnailUrl || null,
        type,
        road,
        tags: tags || [],
        description: description || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    console.error("Failed to create external content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
