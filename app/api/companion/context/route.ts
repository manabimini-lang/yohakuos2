// ===================================================
// YOHAKU Companion — API: Context (Memory Retrieval)
// ===================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildCompanionContext } from "@/lib/companion/retrieval";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const context = await buildCompanionContext(userId);
        return NextResponse.json({ context });
    } catch (error: any) {
        console.error("[Companion Context Error]", error);
        return NextResponse.json(
            { error: "Failed to build context", detail: error?.message },
            { status: 500 }
        );
    }
}