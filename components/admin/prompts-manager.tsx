"use client";

import { useState, useEffect } from "react";
import { getRoadPrompts, saveRoadPrompt } from "@/app/admin/actions";
import { Sparkles, Save, CheckCircle2, AlertCircle } from "lucide-react";

type RoadPromptInfo = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  roadPrompt: {
    systemPrompt: string;
  } | null;
};

export function PromptsManager() {
  const [roads, setRoads] = useState<RoadPromptInfo[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoadPrompts();
      setRoads(data);
      if (data.length > 0) {
        setSelectedRoadId(data[0].id);
        setSystemPrompt(data[0].roadPrompt?.systemPrompt || "");
      }
    } catch (err: any) {
      console.error(err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // Switch selected road and update textarea content
  const handleRoadChange = (roadId: string) => {
    setSelectedRoadId(roadId);
    const road = roads.find((r) => r.id === roadId);
    setSystemPrompt(road?.roadPrompt?.systemPrompt || "");
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedRoadId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await saveRoadPrompt(selectedRoadId, systemPrompt);
      if (res.ok) {
        // Update local roads state
        setRoads((prev) =>
          prev.map((r) =>
            r.id === selectedRoadId
              ? {
                  ...r,
                  roadPrompt: { systemPrompt },
                }
              : r
          )
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("保存に失敗しました。");
      }
    } catch (err: any) {
      console.error(err);
      setError("保存処理中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  const selectedRoad = roads.find((r) => r.id === selectedRoadId);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground font-mono tracking-widest animate-pulse">
          文脈データを読み込んでいます...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Toast notifications */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>プロンプト文脈を保存しました</span>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 text-xs text-red-500 bg-red-50/50 border border-red-100 p-4 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-serif text-foreground tracking-wide flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
          <span>AI整理文脈管理</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ロードごとのAIによる状態整理の文脈（システムプロンプト）を管理・編集します。
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Road selector dropdown */}
        <div className="space-y-2">
          <label htmlFor="road-select" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            対象のロードを選択
          </label>
          <select
            id="road-select"
            value={selectedRoadId}
            onChange={(e) => handleRoadChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-0 transition-colors"
          >
            {roads.map((r) => (
              <option key={r.id} value={r.id}>
                {r.icon} {r.title} ({r.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Selected road details */}
        {selectedRoad && (
          <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">ロードの説明</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{selectedRoad.description}</p>
          </div>
        )}

        {/* Prompt editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="prompt-textarea" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              AI整理用システムプロンプト
            </label>
            {!systemPrompt && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                デフォルトの文脈が適用されています
              </span>
            )}
          </div>
          <textarea
            id="prompt-textarea"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={`例：${selectedRoad?.title || "このロード"}の文脈において、ユーザーが教育現場で抱える特有の感情や悩みに対して、共感的かつ客観的に状態を整理してください。`}
            rows={10}
            className="w-full rounded-xl border border-input bg-background px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-0 resize-y leading-relaxed font-mono"
            disabled={saving}
          />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            ※ 未設定の場合は、デフォルトの文脈（「<code>[ロード名]としての文脈（[ロード説明]）を理解してください。</code>」）が自動的に適用されます。
          </p>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !selectedRoadId}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-medium px-5 py-2.5 text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "保存中..." : "保存する"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
