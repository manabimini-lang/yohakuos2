"use client";

import { useState, useEffect } from "react";
import { addPersonalLog, getPersonalLogs, getCurrentRoad, setCurrentRoad, PersonalLog } from "@/lib/utils/log-db";
import { MoodSelector } from "./mood-selector";
import { LogList } from "./log-list";

const DEFAULT_ROADS = [
  { id: "beginner", slug: "beginner", title: "初任者ロード", icon: "🌱", description: "新しい環境での学びや日々の小さな気づきを記録します。" },
  { id: "side-hustle", slug: "side-hustle", title: "副業ロード", icon: "💻", description: "本業とは別の挑戦や、プロジェクトの進行状況を記録します。" },
  { id: "resignation", slug: "resignation", title: "退職ロード", icon: "🚪", description: "次のステップへ向けた準備や、感情の整理を記録します。" },
];

export function LogClient() {
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);
  const [logs, setLogs] = useState<PersonalLog[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number>(0);
  const [tagsInput, setTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentRoad, setCurrentRoad] = useState<string>("beginner");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadLogs();
    loadPreferences();
    loadRoads();

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => {
        setIsOffline(false);
        loadRoads();
      };
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const loadRoads = async () => {
    try {
      const res = await fetch("/api/roads");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: r.slug,
            slug: r.slug,
            title: r.title,
            description: r.description,
            icon: r.icon
          }));
          setRoads(mapped);
        }
      }
    } catch (error) {
      console.error("Failed to load roads:", error);
    }
  };

  const loadPreferences = async () => {
    const road = await getCurrentRoad();
    setCurrentRoad(road);
  };

  const handleRoadChange = async (roadId: string) => {
    setCurrentRoad(roadId);
    await setCurrentRoad(roadId);
  };

  const loadLogs = async () => {
    const data = await getPersonalLogs();
    setLogs(data);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    
    // Parse tags: split by spaces or commas, remove empty, remove '#' if user typed it
    const tags = tagsInput
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, "").trim())
      .filter(t => t.length > 0);

    try {
      await addPersonalLog({
        road: currentRoad,
        content: content.trim(),
        mood,
        tags
      });

      // Reset form
      setContent("");
      setMood(0);
      setTagsInput("");
      
      // Show toast
      setToastMessage("ログを保存しました");
      setTimeout(() => setToastMessage(null), 3000);

      // Reload
      await loadLogs();
    } catch (error) {
      console.error(error);
      setToastMessage("保存に失敗しました");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      {/* Road Selector Tabs */}
      <section className="mb-12">
        <div className="flex items-center justify-between border-b border-slate-100 pb-px">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {roads.map((road) => (
              <button
                key={road.id}
                onClick={() => handleRoadChange(road.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                  currentRoad === road.id
                    ? "border-b-2 border-slate-900 text-slate-900"
                    : "border-b-2 border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-lg">{road.icon}</span>
                {road.title}
              </button>
            ))}
          </div>
          {isOffline && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 animate-pulse font-sans">
              オフラインモード
            </span>
          )}
        </div>
        
        <div className="mt-6 rounded-2xl bg-slate-50 p-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            {roads.find(r => r.id === currentRoad)?.description}
          </p>
        </div>
      </section>

      {/* Input Area */}
      <section className="mb-16 space-y-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今日はどんなことがありましたか？"
          rows={5}
          disabled={isSaving}
          className="w-full resize-none rounded-2xl border-none bg-slate-50/50 p-6 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-200 transition-colors"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-6">
            <MoodSelector value={mood} onChange={setMood} />
            
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#授業 #退勤"
              disabled={isSaving}
              className="w-40 border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="shrink-0 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "ログを残す"}
          </button>
        </div>
      </section>

      {/* Log List */}
      <section>
        <LogList logs={logs.filter(log => log.road === currentRoad)} />
      </section>
    </div>
  );
}
