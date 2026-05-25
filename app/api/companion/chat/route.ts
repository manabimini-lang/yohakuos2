// ===================================================
// YOHAKU Companion — API: Chat (Stream/Async)
// ===================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCompanionResponse } from "@/lib/companion/engine";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
        return NextResponse.json(
            { error: "conversationId and message are required" },
            { status: 400 }
        );
    }

    try {
        const response = await generateCompanionResponse(
            userId,
            conversationId,
            message
        );

        return NextResponse.json({
            ...response,
            conversationId,
        });
    } catch (error: any) {
        console.error("[Companion Chat Error]", error);
        return NextResponse.json(
            {
                error: "Failed to generate response",
                detail: error?.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}