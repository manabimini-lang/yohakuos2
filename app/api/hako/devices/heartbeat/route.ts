import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSecret } from "@/lib/hako/device-link";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token.startsWith("hko_")) return NextResponse.json({ error: "デバイス認証が必要です" }, { status: 401 });
  const device = await prisma.hakoDevice.updateMany({ where: { tokenHash: hashSecret(token) }, data: { lastSeenAt: new Date() } });
  if (device.count !== 1) return NextResponse.json({ error: "デバイス認証が無効です" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
