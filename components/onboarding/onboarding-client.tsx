"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentRoad } from "@/lib/utils/log-db";
import { Sparkles, Route, PenLine, Key, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const starterPrompts = [
  {
    title: "今、気になっていることは？",
    description: "仕事でも生活でも、頭に残っていることを1つ書いてください。",
    placeholder: "例：今週は会議が多くて、集中する時間が足りない",
    tag: "今の関心",
  },
  {
    title: "最近、うまくいったことは？",
    description: "小さなことで構いません。続けたいことを1つ書いてください。",
    placeholder: "例：朝に30分だけ作業すると、落ち着いて始められた",
    tag: "うまくいったこと",
  },
  {
    title: "次に進めたいことは？",
    description: "今日か今週にできそうなことを1つ書いてください。",
    placeholder: "例：明日の午前中に企画書の見出しだけ作る",
    tag: "次に進めたいこと",
  },
] as const;

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRoad, setSelectedRoad] = useState("");
  const [firstLogText, setFirstLogText] = useState("");
  const [starterLogIndex, setStarterLogIndex] = useState(0);
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"gemini" | "groq">("gemini");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const handleSelectRoad = async (roadId: string) => {
    setSelectedRoad(roadId);
    await setCurrentRoad(roadId);
    setStep(2);
  };

  const handleSaveFirstLog = async () => {
    if (!firstLogText.trim() || savingLog) return;
    setSavingLog(true);
    setLogError("");
    try {
      const content = firstLogText.trim();
      const response = await fetch("/api/yui/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: starterPrompts[starterLogIndex].title,
          summary: content.slice(0, 180),
          body: content,
          importance: 3,
          tags: ["はじめの一歩", starterPrompts[starterLogIndex].tag, selectedRoad || "beginner"],
          source_type: "onboarding",
        }),
      });
      if (!response.ok) throw new Error("Failed to save onboarding memory");
      if (starterLogIndex < starterPrompts.length - 1) {
        setStarterLogIndex((current) => current + 1);
        setFirstLogText("");
      } else {
        setStep(4);
      }
    } catch {
      setLogError("記録を保存できませんでした。もう一度お試しください。");
    } finally {
      setSavingLog(false);
    }
  };

  const handleSkipStarterLog = () => {
    setFirstLogText("");
    setLogError("");
    if (starterLogIndex < starterPrompts.length - 1) {
      setStarterLogIndex((current) => current + 1);
    } else {
      setStep(4);
    }
  };

  const handleSkipRemainingStarterLogs = () => {
    setFirstLogText("");
    setLogError("");
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
      const testResponse = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmedKey, provider }),
      });
      const test = await testResponse.json().catch(() => null);
      if (!testResponse.ok || !test?.connected) {
        setKeyError(test?.error ?? `${provider === "groq" ? "Groq" : "Gemini"} APIキーのテスト接続に失敗しました。キーの権限等をご確認ください。`);
        setTestingKey(false);
        return;
      }
      const saveResponse = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: trimmedKey, isEnabled: true }),
      });
      const result = await saveResponse.json().catch(() => null);
      if (!saveResponse.ok || !result?.success) {
        setKeyError(result?.error ?? "APIキーの保存に失敗しました。");
        setTestingKey(false);
        return;
      }
      window.dispatchEvent(new Event("yohaku_ai_connection_changed"));
      
      await handleComplete();
    } catch (err) {
      setKeyError("エラーが発生しました。");
      setTestingKey(false);
    }
  };

  const handleSkip = () => {
    void handleComplete();
  };

  const handleComplete = async () => {
    localStorage.setItem("yohaku_onboarding_completed", "true");
    setStep(5);
    try {
      await fetch("/api/yui/onboarding/complete", { method: "POST" });
    } catch {
      // The YUI welcome card remains available as a fallback if this request fails.
    }
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

      {/* Step 1: Starting purpose */}
      {step === 1 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
              今日は何を整理したいですか？
            </h1>
            <p className="text-sm text-muted-foreground">
              近いものを選んでください。あとから変更できます。
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              { id: "beginner", label: "日々のことを整理したい", desc: "仕事・生活・学びなど、気になっていることを記録する", icon: "📝" },
              { id: "side-hustle", label: "新しい挑戦を進めたい", desc: "副業や個人プロジェクトなど、進め方を整える", icon: "💡" },
              { id: "resignation", label: "環境の変化を整えたい", desc: "転職・退職・引っ越しなど、次の準備をする", icon: "🌿" },
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
          <p className="text-center text-xs leading-6 text-muted-foreground">ここで選ぶのは、記録を見返すための分類です。利用できる機能は変わりません。</p>
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
              YOHAKUは、気になったことを記録して、あとから振り返るアプリです。
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              きれいな文章にしなくて大丈夫です。最初に3つの短いメモを残すと、YOHAKUがあなたの関心や次に進めたいことを理解しやすくなります。
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <span>はじめる</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Three starter logs */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
              3分で初期設定 {starterLogIndex + 1} / {starterPrompts.length}
            </p>
            <h1 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
              {starterPrompts[starterLogIndex].title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {starterPrompts[starterLogIndex].description} あとから編集・削除できます。
            </p>
          </div>

          <div className="flex gap-2" aria-label="初期記録の進捗">
            {starterPrompts.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${index <= starterLogIndex ? "bg-slate-900" : "bg-slate-200"}`}
              />
            ))}
          </div>

          <div className="relative rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
            <textarea
              value={firstLogText}
              onChange={(e) => setFirstLogText(e.target.value)}
              placeholder={starterPrompts[starterLogIndex].placeholder}
              className="w-full resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus:ring-0 text-base leading-relaxed outline-none"
              rows={4}
            />
            {logError ? <p className="mt-3 text-xs text-red-500" role="alert">{logError}</p> : null}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSkipStarterLog}
                disabled={savingLog}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                この質問はスキップ
              </button>
              <button
                onClick={handleSaveFirstLog}
                disabled={!firstLogText.trim() || savingLog}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <span>{savingLog ? "保存中..." : starterLogIndex < starterPrompts.length - 1 ? "記録して次へ" : "3件目を記録して進む"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSkipRemainingStarterLogs}
              disabled={savingLog}
              className="mt-4 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              残りの記録はあとで入力する
            </button>
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
              無料プランのAI相談を設定する（任意）
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              無料プランではご自身のGeminiまたはGroq APIキーを設定します。PremiumではAPIキー不要で、AI利用料も月額料金に含まれます。設定は後からでも行えます。
            </p>
          </div>

          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground font-mono tracking-wider uppercase">
                AIサービス
              </label>
              <select
                value={provider}
                onChange={(event) => {
                  setProvider(event.target.value as "gemini" | "groq");
                  setApiKey("");
                  setKeyError("");
                  setIsApiKeyVisible(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-foreground focus:border-slate-400 focus:outline-none"
              >
                <option value="gemini">Google Gemini（文章・写真・記憶の類似検索）</option>
                <option value="groq">Groq（高速な文章生成）</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground font-mono tracking-wider uppercase">
                {provider === "groq" ? "Groq APIキー" : "Gemini APIキー"}
              </label>
              <div className="relative">
                <input
                  type={isApiKeyVisible ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "groq" ? "gsk_..." : "AIza..."}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 font-mono text-sm text-foreground placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setIsApiKeyVisible((current) => !current)}
                  disabled={!apiKey}
                  aria-label={isApiKeyVisible ? "APIキーを隠す" : "APIキーを表示する"}
                  aria-pressed={isApiKeyVisible}
                  className="absolute inset-y-0 right-1 inline-flex w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-slate-50 disabled:opacity-40"
                >
                  {isApiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {keyError && (
                <p className="text-xs text-red-500 mt-1">{keyError}</p>
              )}
              {provider === "groq" ? <p className="text-xs leading-5 text-muted-foreground">Groqは相談・要約などの文章生成に利用できます。写真整理と記憶の類似検索はGemini接続で利用できます。</p> : null}
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <button
                onClick={handleConnectApiKey}
                disabled={testingKey || !apiKey.trim()}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {testingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>接続を確認中...</span>
                  </>
                ) : (
                  <span>接続を確認してはじめる</span>
                )}
              </button>

              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                AI相談は後で設定する
              </button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                後回しにしても、メモ・目的・振り返りは利用できます。
              </p>
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
            <p className="text-xs text-muted-foreground">ホーム上部の「相談する・今日やることを決める・振り返る」から始められます。</p>
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
