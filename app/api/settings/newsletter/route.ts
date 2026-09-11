import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { newsletterOptIn: true } });
  return NextResponse.json({ newsletterOptIn: user?.newsletterOptIn ?? false });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.newsletterOptIn !== "boolean") return NextResponse.json({ error: "設定値が不正です。" }, { status: 400 });
  const newsletterOptIn = body.newsletterOptIn;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { newsletterOptIn, newsletterOptInAt: newsletterOptIn ? new Date() : undefined, newsletterOptOutAt: newsletterOptIn ? null : new Date() },
    select: { newsletterOptIn: true },
  });
  return NextResponse.json(user);
}
