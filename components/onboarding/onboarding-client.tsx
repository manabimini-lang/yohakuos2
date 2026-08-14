"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentRoad, addPersonalLog } from "@/lib/utils/log-db";
import { updateAiKeyAction } from "@/lib/actions/settings/update-ai-key";
import { saveSecureApiKey } from "@/lib/utils/secure-storage";
import { Sparkles, Route, PenLine, Key, ArrowRight, Loader2 } from "lucide-react";

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRoad, setSelectedRoad] = useState("");
  const [firstLogText, setFirstLogText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const handleSelectRoad = async (roadId: string) => {
    setSelectedRoad(roadId);
    await setCurrentRoad(roadId);
    setStep(2);
  };

  const handleSaveFirstLog = async () => {
    if (firstLogText.trim()) {
      await addPersonalLog({
        road: selectedRoad || "beginner",
        content: firstLogText.trim(),
        mood: 3,
        tags: ["はじめの一歩"],
      });
    }
    setStep(4);
  };

  const handleConnectApiKey = async () => {
    if (!apiKey.trim()) {
      handleSkip();
      return;
    }

    setTestingKey(true);
    setKeyError("");

    try {
      const trimmedKey = apiKey.trim();
      const result = await updateAiKeyAction(trimmedKey);
      if (!result.ok) {
        setKeyError(result.error ?? "APIキーが無効、または接続に失敗しました。");
        setTestingKey(false);
        return;
      }

      // API Key validation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${trimmedKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (!response.ok) {
        setKeyError("Gemini APIキーのテスト接続に失敗しました。キーの権限等をご確認ください。");
        setTestingKey(false);
        return;
      }

      await saveSecureApiKey("gemini", trimmedKey);
      window.dispatchEvent(new Event("yohaku_ai_connection_changed"));
      
      handleComplete();
    } catch (err) {
      setKeyError("エラーが発生しました。");
      setTestingKey(false);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("yohaku_onboarding_completed", "true");
    setStep(5);
    setTimeout(() => {
      router.push("/yui");
    }, 1500);
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-[60vh] flex flex-col justify-center px-6 py-12 selection:bg-slate-100">
      {/* Progress dot indicator */}
      <div className="flex justify-center space-x-2 mb-16">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === i 
                ? "w-8 bg-slate-900" 
                : step > i 
                  ? "w-2 bg-slate-300" 
                  : "w-2 bg-slate-150"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Road Selection */}
      {step === 1 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
              どの道を歩んでいますか？
            </h1>
            <p className="text-sm text-muted-foreground">
              今のあなたに最も近い状態を選択してください
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              { id: "beginner", label: "初任者ロード", desc: "仕事に慣れる、基本を習得する段階", icon: "🌱" },
              { id: "side-hustle", label: "副業ロード", desc: "本業とバランスをとりながら新しい軸を作る段階", icon: "💻" },
              { id: "resignation", label: "退職ロード", desc: "次のステップへ進むため、今を整え引き継ぐ段階", icon: "🚪" },
            ].map((road) => (
              <button
                key={road.id}
                onClick={() => handleSelectRoad(road.id)}
                className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-slate-350 hover:bg-slate-50/50 bg-white transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="text-base">{road.icon}</span>
                      <span>{road.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">{road.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Philosophy */}
      {step === 2 && (
        <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-muted-foreground">
            <Sparkles className="w-5 h-5 stroke-[1.5]" />
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-lg md:text-xl font-medium text-foreground leading-relaxed font-serif">
              YOHAKUは、毎日の記録を整理し、小さく積み重ねる場所です。
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              ここに他のSNSのような競争や数字はありません。ただあなたが立ち止まり、余白を作り、次の一歩を踏み出すのを優しく見守るツールです。
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-foreground hover:bg-slate-800 transition-colors"
            >
              <span>はじめる</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: First Log */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
              いま、どんな気持ちですか？
            </h1>
            <p className="text-sm text-muted-foreground">
              最初の一歩として、いま心にあることを少しだけ書いてみましょう
            </p>
          </div>

          <div className="relative rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
            <textarea
              value={firstLogText}
              onChange={(e) => setFirstLogText(e.target.value)}
              placeholder="今気になっていることを書いてみる"
              className="w-full resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus:ring-0 text-base leading-relaxed outline-none"
              rows={4}
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveFirstLog}
                disabled={!firstLogText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <span>記録して進む</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: AI Connection */}
      {step === 4 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-muted-foreground mb-2">
              <Key className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
              AI（Gemini）と接続する
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              AIを接続すると、ログの自動整理や気づき・課題の抽出が利用できます
            </p>
          </div>

          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground font-mono tracking-wider uppercase">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AI-key..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"
              />
              {keyError && (
                <p className="text-xs text-red-500 mt-1">{keyError}</p>
              )}
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <button
                onClick={handleConnectApiKey}
                disabled={testingKey || !apiKey.trim()}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-foreground font-medium py-3 transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {testingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>接続テスト中...</span>
                  </>
                ) : (
                  <span>接続してはじめる</span>
                )}
              </button>

              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-slate-650 transition-colors py-2 font-mono"
              >
                Skip (後で設定する)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Completed Loading Screen */}
      {step === 5 && (
        <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-1000">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-serif text-foreground">準備が整いました</h1>
            <p className="text-xs text-muted-foreground">YOHAKUの空間へ移動しています...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Quiet SVG chevron icon
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
