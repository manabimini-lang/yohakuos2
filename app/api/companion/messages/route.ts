// ===================================================
// YOHAKU Companion — API: Messages (History)
// ===================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
        return NextResponse.json(
            { error: "conversationId is required" },
            { status: 400 }
        );
    }

    // Verify ownership
    const conversation = await prisma.companionConversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
    });

    if (!conversation || conversation.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.companionMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
        },
    });

    return NextResponse.json({ messages });
}