import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildLegacyTextExport, getLegacyPageData, getLatestLegacySnapshot } from "@/lib/legacy/legacy-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const latestSnapshot = await getLatestLegacySnapshot(session.user.id);
  let content: string;

  if (latestSnapshot) {
    content = latestSnapshot.content;
  } else {
    const data = await getLegacyPageData(session.user.id);
    content = buildLegacyTextExport(data);
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="yohaku-legacy-snapshot.txt"`,
    },
  });
}
