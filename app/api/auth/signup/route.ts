// ===================================================
// YOHAKU Auth Core — Sign-Up API Route
// ===================================================

import { NextResponse } from "next/server";
import { signUpWithEmail } from "@/core/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Handle JSON request body
    let email: string | undefined;
    let password: string | undefined;
    let displayName: string | undefined;

    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
      displayName = body.displayName;
    } catch {
      // If JSON parsing fails, try formData
      const formData = await request.formData();
      email = formData.get("email") as string;
      password = formData.get("password") as string;
      displayName = formData.get("displayName") as string | undefined;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください。" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上である必要があります。" },
        { status: 400 }
      );
    }

    const result = await signUpWithEmail(email, password, displayName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "アカウント作成に失敗しました。" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/signup] Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}