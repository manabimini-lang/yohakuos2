import { NextResponse } from "next/server";
import { processWisdomInsightQueue } from "@/prisma/wisdom-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // This triggers the heavy wisdom generation process
    // In production, this should ideally be an edge function or a long-running queue task
    await processWisdomInsightQueue();

    return NextResponse.json({
      success: true,
      message: "Wisdom insight processing started."
    });
  } catch (error: any) {
    console.error("[PROCESS_WISDOM_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}