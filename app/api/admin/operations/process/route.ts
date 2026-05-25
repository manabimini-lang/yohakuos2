// ===================================================
// YOHAKU Queue & Worker — Process Pending Jobs API
// ===================================================

import { NextResponse } from "next/server";
import { queue } from "@/services/queue";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const processed = await queue.processAll();
    return NextResponse.json({ processed });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process jobs" },
      { status: 500 },
    );
  }
}