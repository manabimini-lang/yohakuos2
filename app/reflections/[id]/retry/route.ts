import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { retryAudioReflectionGeneration } from "@/app/actions/retry-audio-reflection";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const reflectionId = params.id;

  try {
    await retryAudioReflectionGeneration(reflectionId);
  } catch (err) {
    console.error("Retry audio reflection failed:", err);
  }

  return NextResponse.redirect(new URL("/reflections", request.url));
}
