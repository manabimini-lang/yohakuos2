// ===================================================
// YOHAKU Queue & Worker — Retry Failed Jobs API
// ===================================================

import { NextResponse } from "next/server";
import { queue } from "@/services/queue";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const retried = await queue.retryAllFailed();
    return NextResponse.json({ retried });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retry jobs" },
      { status: 500 },
    );
  }
}