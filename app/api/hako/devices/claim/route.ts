import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createDeviceToken, hashSecret } from "@/lib/hako/device-link";

export const runtime = "nodejs";

const input = z.object({ code: z.string().regex(/^[A-Z2-9]{12}$/), deviceName: z.string().trim().min(1).max(48) });

export async function POST(request: NextRequest) {
  let value: z.infer<typeof input>;
  try { value = input.parse(await request.json()); }
  catch { return NextResponse.json({ error: "リンクコードを確認してください" }, { status: 400 }); }

  const now = new Date();
  const matching = await prisma.hakoLinkCode.findUnique({ where: { codeHash: hashSecret(value.code) } });
  if (!matching || matching.usedAt || matching.expiresAt <= now) return NextResponse.json({ error: "リンクコードが無効または期限切れです" }, { status: 409 });

  const token = createDeviceToken();
  const result = await prisma.$transaction(async (tx) => {
    const consumed = await tx.hakoLinkCode.updateMany({ where: { id: matching.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (consumed.count !== 1) return null;
    return tx.hakoDevice.create({ data: { userId: matching.userId, displayName: value.deviceName, tokenHash: hashSecret(token), lastSeenAt: now }, select: { id: true, displayName: true } });
  });
  if (!result) return NextResponse.json({ error: "リンクコードはすでに使用されています" }, { status: 409 });
  return NextResponse.json({ device: result, deviceToken: token }, { status: 201 });
}
