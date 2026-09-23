import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLinkCode, hashSecret } from "@/lib/hako/device-link";

export const runtime = "nodejs";

async function userId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const devices = await prisma.hakoDevice.findMany({ where: { userId: id }, orderBy: { updatedAt: "desc" }, select: { id: true, displayName: true, lastSeenAt: true, createdAt: true } });
  return NextResponse.json({ devices });
}

export async function POST() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const code = createLinkCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.$transaction([
    prisma.hakoLinkCode.deleteMany({ where: { userId: id } }),
    prisma.hakoLinkCode.create({ data: { userId: id, codeHash: hashSecret(code), expiresAt } }),
  ]);
  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() }, { status: 201 });
}
