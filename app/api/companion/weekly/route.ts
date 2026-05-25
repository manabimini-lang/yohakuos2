// ===================================================
// YOHAKU Companion — API: Weekly Reflection
// ===================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWeeklyReflection } from "@/lib/companion/engine";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const response = await generateWeeklyReflection(userId);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("[Weekly Reflection Error]", error);
        return NextResponse.json(
            {
                error: "Failed to generate weekly reflection",
                detail: error?.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}