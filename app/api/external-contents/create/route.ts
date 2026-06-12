import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, url, thumbnailUrl, type, road, tags, description } = body;

    const content = await prisma.externalContent.create({
      data: {
        title,
        url,
        thumbnailUrl,
        type,
        road,
        tags: tags || [],
        description,
        createdBy: session.user.id, // ここに CUID (clxt...) が入る
      },
    });

    // キャッシュを無効化して一覧を更新
    revalidatePath("/admin/external-resources");

    return NextResponse.json(content);
  } catch (error: any) {
    console.error("ExternalContent creation error:", error);
    // 22P02 エラーが解消されていることを確認
    return NextResponse.json(
      { error: "保存に失敗しました。ID形式の整合性を確認してください。" },
      { status: 500 }
    );
  }
}