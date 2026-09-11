import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { discordId: null, discordName: null, discordAvatar: null },
  });

  // Keep the YUI connection registry in sync with the account record.
  try {
    const { error: connectionError } = await getSupabaseAdmin()
      .from("connections")
      .update({ status: "disconnected", updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("provider", "discord");
    if (connectionError) {
      console.warn("Failed to update Discord connection status", connectionError.message);
    }
  } catch (error) {
    console.warn("Discord connection registry is unavailable", error);
  }

  return NextResponse.json({ ok: true });
}
