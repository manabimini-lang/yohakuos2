import { NextResponse } from "next/server";
import { getCurrentSession } from "@/core/auth/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { storagePathFromReference } from "@/lib/audio/audio-history";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session?.id) return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });

  const reflection = await prisma.audioReflection.findUnique({
    where: { id: params.id },
    select: { userId: true, audioUrl: true },
  });
  if (!reflection || reflection.userId !== session.id) return NextResponse.json({ error: "音声が見つかりません。" }, { status: 404 });

  const path = storagePathFromReference(reflection.audioUrl);
  if (!path) return NextResponse.json({ error: "この音声形式は再生できません。" }, { status: 422 });

  const { data, error } = await getSupabaseAdmin().storage.from("yohaku-audio").download(path);
  if (error || !data) {
    console.warn("[yui/audio] download failed", { error: error?.message });
    return NextResponse.json({ error: "音声を読み込めませんでした。" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(data.size),
      "Cache-Control": "private, max-age=300",
      "Accept-Ranges": "bytes",
    },
  });
}
