import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toUuid } from "@/lib/supabase/utils";
import { hasPremiumAccess } from "@/lib/constants/plan";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verify user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify premium plan
    if (!hasPremiumAccess(session.user.plan, session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Premium plan required" }, { status: 403 });
    }

    // 3. Extract request body
    const { title, summary, tags, road } = await req.json();

    if (!title || !summary || !road) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Translate NextAuth string ID deterministically to UUID format for Postgres
    const createdByUuid = toUuid(session.user.id);

    // 4. Save to Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shared_knowledge")
      .insert({
        title,
        summary,
        tags: tags || [],
        road,
        created_by: createdByUuid,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Knowledge creation error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
