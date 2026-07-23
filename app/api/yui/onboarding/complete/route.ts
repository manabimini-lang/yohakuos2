import { NextResponse } from "next/server";
import { postYuiCompleteOnboarding } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const profile = await postYuiCompleteOnboarding();
    return NextResponse.json(profile);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Failed to complete onboarding";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
