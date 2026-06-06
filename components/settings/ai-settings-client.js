"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSettingsClient = AiSettingsClient;
var react_1 = require("react");
var link_1 = require("next/link");
var lucide_react_1 = require("lucide-react");
var ai_settings_1 = require("@/app/actions/ai-settings");
function AiSettingsClient(_a) {
    var _this = this;
    var initialSettings = _a.initialSettings;
    var _b = (0, react_1.useState)((initialSettings === null || initialSettings === void 0 ? void 0 : initialSettings.provider) || "gemini"), provider = _b[0], setProvider = _b[1];
    var _c = (0, react_1.useState)((initialSettings === null || initialSettings === void 0 ? void 0 : initialSettings.hasKey) ? "••••••••" : ""), apiKey = _c[0], setApiKey = _c[1];
    var _d = (0, react_1.useState)((initialSettings === null || initialSettings === void 0 ? void 0 : initialSettings.isEnabled) || false), isEnabled = _d[0], setIsEnabled = _d[1];
    var FIXED_MODEL = "gemini-2.5-flash";
    var _e = (0, react_1.useState)(false), testing = _e[0], setTesting = _e[1];
    var _f = (0, react_1.useState)(false), saving = _f[0], setSaving = _f[1];
    var _g = (0, react_1.useState)(null), statusMsg = _g[0], setStatusMsg = _g[1];
    var handleTestConnection = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setTesting(true);
                    setStatusMsg(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/ai/test-connection", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                provider: provider,
                                apiKey: apiKey === "••••••••" ? "" : apiKey, // If it's the placeholder, let API use existing key from DB (by omitting/sending blank)
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (response.ok && data.connected) {
                        setStatusMsg({
                            type: "success",
                            text: "\u63A5\u7D9A\u306B\u6210\u529F\u3057\u307E\u3057\u305F\u3002".concat(data.message || "静かに接続されました。"),
                        });
                    }
                    else {
                        setStatusMsg({
                            type: "error",
                            text: data.error || "接続テストに失敗しました。キーを確認してください。",
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    setStatusMsg({
                        type: "error",
                        text: "接続テスト中にエラーが発生しました。",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setTesting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSave = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    setStatusMsg(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, ai_settings_1.saveAISettings)({
                            provider: provider,
                            apiKey: apiKey,
                            model: FIXED_MODEL,
                            isEnabled: isEnabled,
                        })];
                case 2:
                    _a.sent();
                    setStatusMsg({
                        type: "success",
                        text: isEnabled ? "AI設定を保存し、静かに接続されました。" : "AI設定を保存し、機能を停止しました。",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    setStatusMsg({
                        type: "error",
                        text: error_2.message || "設定の保存に失敗しました。",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100 w-full">
      {/* Back to Profile */}
      <div>
        <link_1.default href="/profile" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-650 transition-colors font-mono">
          <lucide_react_1.ChevronLeft className="w-3.5 h-3.5 mr-1"/>
          Profile
        </link_1.default>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-slate-800 tracking-wide">
          AI接続設定
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isEnabled
            ? "静かに接続されています。"
            : "AIを接続すると、余白に意味がゆっくり積もり始めます。"}
        </p>
      </div>

      {/* Status Notifications */}
      {statusMsg && (<div className={"flex items-start space-x-3 rounded-2xl border p-4 animate-in fade-in duration-300 ".concat(statusMsg.type === "success"
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                : "bg-rose-50/50 border-rose-100 text-rose-700")}>
          {statusMsg.type === "success" ? (<lucide_react_1.CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/>) : (<lucide_react_1.AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"/>)}
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{statusMsg.type === "success" ? "完了" : "注意"}</p>
            <p className="text-[11px] leading-relaxed opacity-90">{statusMsg.text}</p>
          </div>
        </div>)}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-150 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        {/* Header Indicator */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
          <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
            <lucide_react_1.Sparkles className="w-5 h-5 stroke-[1.5]"/>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">API接続</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">あなた個人のAIリソースを接続します</p>
          </div>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100/80">
          <div className="space-y-0.5">
            <label htmlFor="ai-enable-toggle" className="text-xs font-semibold text-slate-700">AIによる自動解析</label>
            <p className="text-[10px] text-slate-400">有効にすると、保存した内容を自動で要約・タグ付けします</p>
          </div>
          <button type="button" id="ai-enable-toggle" onClick={function () { return setIsEnabled(!isEnabled); }} className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ".concat(isEnabled ? "bg-slate-900" : "bg-slate-200")}>
            <span className={"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(isEnabled ? "translate-x-5" : "translate-x-0")}/>
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Provider Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">プロバイダー</label>
            <select value={provider} onChange={function (e) { return setProvider(e.target.value); }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-slate-400 transition-colors">
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 block">APIキー</label>
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors underline">
                キーの取得方法
              </a>
            </div>
            <div className="relative">
              <lucide_react_1.Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"/>
              <input type="password" value={apiKey} onChange={function (e) { return setApiKey(e.target.value); }} placeholder="AIzaSy..." className="w-full text-xs rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-colors font-mono"/>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">利用モデル</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              gemini-2.5-flash（固定）
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-50 flex items-center space-x-3">
          <button type="button" onClick={handleTestConnection} disabled={testing || saving || (!apiKey && !(initialSettings === null || initialSettings === void 0 ? void 0 : initialSettings.hasKey))} className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-600 font-medium px-4 py-2.5 transition-colors text-xs disabled:opacity-50 disabled:pointer-events-none">
            {testing ? (<>
                <lucide_react_1.Loader2 className="w-3.5 h-3.5 animate-spin"/>
                <span>テスト中...</span>
              </>) : (<span>接続テスト</span>)}
          </button>

          <button type="submit" disabled={saving || testing} className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium px-4 py-2.5 transition-colors text-xs disabled:opacity-50 disabled:pointer-events-none shadow-sm">
            {saving ? (<>
                <lucide_react_1.Loader2 className="w-3.5 h-3.5 animate-spin"/>
                <span>保存中...</span>
              </>) : (<span>設定を保存</span>)}
          </button>
        </div>
      </form>

      {/* Limits & Security Note */}
      <div className="flex items-start space-x-2.5 max-w-sm mx-auto text-[10px] text-slate-450 leading-relaxed">
        <lucide_react_1.AlertCircle className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5"/>
        <div className="space-y-1">
          <p>
            APIキーは高度な暗号化（AES-256-GCM）を施した上で、安全にデータベースに保存されます。
          </p>
          <p>
            自動制限機能により、1日あたり100,000トークン、月間2,000,000トークンを超える処理は自動的に一時停止し、予期せぬ料金の発生を防ぎます。
          </p>
        </div>
      </div>
    </div>);
}
