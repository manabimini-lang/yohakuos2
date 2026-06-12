import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    revalidatePath("/admin/contents");
    revalidatePath("/admin/external-resources");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete external content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, url, thumbnailUrl, type, road, tags, description } = body;

    const updatedContent = await prisma.externalContent.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(road !== undefined ? { road } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    revalidatePath("/admin/contents");
    revalidatePath("/admin/external-resources");

    return NextResponse.json({ success: true, content: updatedContent });
  } catch (error) {
    console.error("Failed to update external content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
