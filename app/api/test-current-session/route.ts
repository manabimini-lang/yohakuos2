import { NextResponse } from "next/server";
import { getCurrentSession } from "@/core/auth/server";

export async function GET() {
  try {
    const session = await getCurrentSession();
    return NextResponse.json({ 
      hasSession: !!session, 
      session 
    });
  } catch (error) {
    return NextResponse.json({ 
      hasSession: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
