import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: ユーザーのKnowledgeCard一覧を取得
export async function GET(req: Request) {
    noStore();
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        const where: any = { userId };
        if (type) where.type = type;

        const cards = await prisma.knowledgeCard.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true,
                type: true,
                source: true,
                title: true,
                content: true,
                summary: true,
                tags: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(cards);
    } catch (error) {
        console.error("[KNOWLEDGE_CARDS_LIST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: 新しいKnowledgeCardを作成
export async function POST(req: Request) {
    noStore();
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const { type, source, title, content, summary, tags, metadata } = body;

        if (!type || !content) {
            return NextResponse.json({ error: "type と content は必須です" }, { status: 400 });
        }

        const validTypes = ["url", "text", "youtube", "pdf", "voice", "web_clipping", "ai_conversation", "reflection"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: `無効なtypeです: ${type}` }, { status: 400 });
        }

        const card = await prisma.knowledgeCard.create({
            data: {
                userId,
                type,
                source: source || null,
                title: title || null,
                content,
                summary: summary || null,
                tags: tags || [],
                metadata: metadata || {},
            },
        });

        return NextResponse.json({ success: true, card });
    } catch (error) {
        console.error("[KNOWLEDGE_CARDS_CREATE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}