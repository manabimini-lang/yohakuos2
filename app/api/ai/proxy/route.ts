import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptKey, encryptKey } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if ((session.user as any).plan !== "premium" && (session.user as any).plan !== "PREMIUM") {
      return new NextResponse("Forbidden - Premium required", { status: 403 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { input, systemPrompt, roadContext } = body;

    if (!input) {
      return new NextResponse("Input is required", { status: 400 });
    }

    const userAISettings = await prisma.userAISettings.findUnique({
      where: { userId }
    });

    if (!userAISettings?.encryptedApiKey) {
      return new NextResponse(
        JSON.stringify({ error: "Gemini APIキーまたはGoogle連携が設定されていません。" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let accessToken = "";
    let isOauth = userAISettings.provider === "gemini_oauth";

    if (isOauth) {
      try {
        const decryptedPayload = decryptKey(userAISettings.encryptedApiKey);
        const tokenData = JSON.parse(decryptedPayload);

        if (Date.now() >= tokenData.expires_at - 60000) {
          if (tokenData.refresh_token) {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

            if (clientId && clientSecret) {
              const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: tokenData.refresh_token,
                  grant_type: "refresh_token",
                }),
              });

              if (refreshResponse.ok) {
                const newTokens = await refreshResponse.json();
                
                tokenData.access_token = newTokens.access_token;
                if (newTokens.refresh_token) {
                  tokenData.refresh_token = newTokens.refresh_token;
                }
                tokenData.expires_at = Date.now() + newTokens.expires_in * 1000;

                await prisma.userAISettings.update({
                  where: { userId },
                  data: {
                    encryptedApiKey: encryptKey(JSON.stringify(tokenData))
                  }
                });
              } else {
                await prisma.userAISettings.update({
                  where: { userId },
                  data: {
                    encryptedApiKey: null,
                    isEnabled: false,
                    provider: "gemini",
                  }
                });
                return new NextResponse(
                  JSON.stringify({ error: "Google連携の有効期限が切れました。再接続してください。" }),
                  { status: 401, headers: { "Content-Type": "application/json" } }
                );
              }
            }
          } else {
            return new NextResponse(
              JSON.stringify({ error: "Google連携の有効期限が切れました。再接続してください。" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }
        }
        
        accessToken = tokenData.access_token;
        isOauth = true;

      } catch (e) {
        console.error("Failed to parse or refresh OAuth token", e);
        return new NextResponse(
          JSON.stringify({ error: "Google連携情報の読み込みに失敗しました。再接続してください。" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      try {
        accessToken = decryptKey(userAISettings.encryptedApiKey);
      } catch (e) {
        return new NextResponse(
          JSON.stringify({ error: "APIキーの読み込みに失敗しました。" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const systemInstruction = systemPrompt || `あなたはYOHAKU AIです。
目的：ユーザーを導くのではなく、状態を整理する。
${roadContext || ""}

出力形式：
## 状態整理
現在の状態を短く整理

## 気づき
行動や感情の意味づけ

## 小さな次の一歩
負荷の小さい行動

制約：
- 3〜5行
- 長文禁止
- 命令禁止
- 優しく整理する`;

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: input.trim() }] }]
    };

    const apiUrl = isOauth
      ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${accessToken}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    if (isOauth) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return new NextResponse(
        JSON.stringify({ error: "AIの生成に失敗しました。" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("[AI_PROXY]", error);
    return new NextResponse(
      JSON.stringify({ error: "内部サーバーエラーが発生しました。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
