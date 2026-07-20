import { NextResponse } from "next/server";
import { getYuiProfileForCurrentUser, patchYuiProfile } from "@/app/ui/backend/yui/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const profile = await getYuiProfileForCurrentUser();
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : "Failed to fetch YUI profile";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = await patchYuiProfile({
      display_name: body.display_name,
      assistant_name: body.assistant_name,
      tone: body.tone,
      life_theme: body.life_theme,
      focus_area: body.focus_area,
      notification_strength: body.notification_strength,
      summary_frequency: body.summary_frequency,
      timezone: body.timezone,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized"
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to update YUI profile";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
