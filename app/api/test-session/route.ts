import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
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
