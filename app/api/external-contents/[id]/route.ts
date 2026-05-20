import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user to verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // 3. Delete external content
    await prisma.externalContent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete external content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
