// ===================================================
// YOHAKU Companion — API: Session Management
// ===================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateConversation, getSessionState } from "@/lib/companion/engine";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
        const state = await getSessionState(conversationId);
        return NextResponse.json({ state });
    }

    // Return latest conversation
    const { id, isNew } = await getOrCreateConversation(userId);
    const state = await getSessionState(id);

    return NextResponse.json({
        conversationId: id,
        isNew,
        state,
    });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const title = body.title || "";

    const { id, isNew } = await getOrCreateConversation(userId, title);

    return NextResponse.json({
        conversationId: id,
        isNew,
    });
}