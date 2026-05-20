"use client";

import { useState } from "react";
import Link from "next/link";
import { getPersonalLogs, importPersonalLogs, PersonalLog } from "@/lib/utils/log-db";
import { ChevronLeft, Database, Download, AlertCircle, FileJson, CheckCircle, Upload } from "lucide-react";

export function DataSettingsClient() {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleExport = async () => {
    setExporting(true);
    setSuccess(false);

    try {
      // 1. Fetch personal logs from IndexedDB
      const logs = await getPersonalLogs();
      setLogsCount(logs.length);

      // 2. Prepare output JSON object
      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        logs: logs,
      };

      // 3. Convert to string blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // 4. Construct file name: yohaku-logs-YYYY-MM-DD.json
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const filename = `yohaku-logs-${year}-${month}-${day}.json`;

      // 5. Download blob locally (no server interactions)
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (error) {
      console.error("Failed to export logs:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        // Validation
        if (!data || typeof data !== "object" || !Array.isArray(data.logs)) {
          throw new Error("Invalid format: logs array missing");
        }

        const validatedLogs: PersonalLog[] = [];
        for (const log of data.logs) {
          if (
            typeof log.id !== "string" ||
            typeof log.road !== "string" ||
            typeof log.content !== "string" ||
            typeof log.created_at !== "number" ||
            typeof log.updated_at !== "number"
          ) {
            throw new Error("Invalid fields inside log item");
          }

          // XSS Defense & Type sanitation
          const cleanLog: PersonalLog = {
            id: String(log.id),
            road: String(log.road),
            content: String(log.content),
            mood: typeof log.mood === "number" ? log.mood : 0,
            tags: Array.isArray(log.tags) ? log.tags.map((t: any) => String(t)) : [],
            created_at: Number(log.created_at),
            updated_at: Number(log.updated_at),
          };
          validatedLogs.push(cleanLog);
        }

        // Import to IndexedDB (Merge Mode)
        await importPersonalLogs(validatedLogs);
        
        showToast("ログを復元しました", "success");
      } catch (err) {
        console.error("Import failed:", err);
        showToast("インポートに失敗しました", "error");
      } finally {
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      showToast("インポートに失敗しました", "error");
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300 ${
          toast.type === "success" ? "bg-slate-900" : "bg-red-650"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Back to Profile */}
      <div>
        <Link 
          href="/profile" 
          className="inline-flex items-center text-xs text-slate-400 hover:text-slate-655 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Profile
        </Link>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-slate-800 tracking-wide flex items-center gap-2">
          <Database className="w-5.5 h-5.5 text-slate-450 stroke-[1.5]" />
          <span>データ管理</span>
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          YOHAKUのログは、あなたの端末内に保存されています
        </p>
      </div>

      {/* Export / Import Card */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            書かれた日々の記録はサーバーには送信されず、ブラウザのローカルデータベース（IndexedDB）に安全に暗号化および保存されています。
            所有権は完全にあなたにあります。
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            端末の変更時のバックアップのために、ローカル形式（JSON）でログデータを書き出し、または復元（インポート）することができます。
          </p>
        </div>

        {/* Success message from export */}
        {success && (
          <div className="flex items-start space-x-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-emerald-700">
              <p className="font-semibold">エクスポート完了</p>
              <p className="text-[11px] text-emerald-600/90 leading-relaxed">
                {logsCount} 件 of ログを含むバックアップファイルをダウンロードしました。
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
            <FileJson className="w-3.5 h-3.5 text-slate-350" />
            <span>JSON format</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {/* Import Button & Hidden File Input */}
            <label className="inline-flex items-center justify-center space-x-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-650 hover:bg-slate-50 font-medium px-4 py-2.5 transition-all text-xs cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>ログをインポート</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 transition-colors text-xs shadow-sm disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  <span>書き出し中...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>ログをエクスポート</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Warning / Privacy policy notice */}
      <div className="flex items-start space-x-2.5 max-w-sm mx-auto text-[10px] text-slate-450 leading-relaxed">
        <AlertCircle className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
        <p>
          YOHAKUは外部とのやり取りを一切行いません。インポートされたデータもブラウザ内でローカルにマージされ、既存のログが消去されることはありません。
        </p>
      </div>
    </div>
  );
}
