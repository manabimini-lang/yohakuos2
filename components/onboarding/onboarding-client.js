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
exports.OnboardingClient = OnboardingClient;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var log_db_1 = require("@/lib/utils/log-db");
var update_ai_key_1 = require("@/lib/actions/settings/update-ai-key");
var secure_storage_1 = require("@/lib/utils/secure-storage");
var lucide_react_1 = require("lucide-react");
function OnboardingClient() {
    var _this = this;
    var router = (0, navigation_1.useRouter)();
    var _a = (0, react_1.useState)(1), step = _a[0], setStep = _a[1];
    var _b = (0, react_1.useState)(""), selectedRoad = _b[0], setSelectedRoad = _b[1];
    var _c = (0, react_1.useState)(""), firstLogText = _c[0], setFirstLogText = _c[1];
    var _d = (0, react_1.useState)(""), apiKey = _d[0], setApiKey = _d[1];
    var _e = (0, react_1.useState)(false), testingKey = _e[0], setTestingKey = _e[1];
    var _f = (0, react_1.useState)(""), keyError = _f[0], setKeyError = _f[1];
    var handleSelectRoad = function (roadId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSelectedRoad(roadId);
                    return [4 /*yield*/, (0, log_db_1.setCurrentRoad)(roadId)];
                case 1:
                    _a.sent();
                    setStep(2);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleSaveFirstLog = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!firstLogText.trim()) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, log_db_1.addPersonalLog)({
                            road: selectedRoad || "beginner",
                            content: firstLogText.trim(),
                            mood: 3,
                            tags: ["はじめの一歩"],
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    setStep(4);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleConnectApiKey = function () { return __awaiter(_this, void 0, void 0, function () {
        var trimmedKey, result, response, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!apiKey.trim()) {
                        handleSkip();
                        return [2 /*return*/];
                    }
                    setTestingKey(true);
                    setKeyError("");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    trimmedKey = apiKey.trim();
                    return [4 /*yield*/, (0, update_ai_key_1.updateAiKeyAction)(trimmedKey)];
                case 2:
                    result = _b.sent();
                    if (!result.ok) {
                        setKeyError((_a = result.error) !== null && _a !== void 0 ? _a : "APIキーが無効、または接続に失敗しました。");
                        setTestingKey(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=".concat(trimmedKey), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: "Hello" }] }]
                            })
                        })];
                case 3:
                    response = _b.sent();
                    if (!response.ok) {
                        setKeyError("Gemini APIキーのテスト接続に失敗しました。キーの権限等をご確認ください。");
                        setTestingKey(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, secure_storage_1.saveSecureApiKey)("gemini", trimmedKey)];
                case 4:
                    _b.sent();
                    window.dispatchEvent(new Event("yohaku_ai_connection_changed"));
                    handleComplete();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _b.sent();
                    setKeyError("エラーが発生しました。");
                    setTestingKey(false);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSkip = function () {
        handleComplete();
    };
    var handleComplete = function () {
        localStorage.setItem("yohaku_onboarding_completed", "true");
        setStep(5);
        setTimeout(function () {
            router.push("/member");
        }, 1500);
    };
    return (<div className="w-full max-w-xl mx-auto min-h-[60vh] flex flex-col justify-center px-6 py-12 selection:bg-slate-100">
      {/* Progress dot indicator */}
      <div className="flex justify-center space-x-2 mb-16">
        {[1, 2, 3, 4].map(function (i) { return (<div key={i} className={"h-1.5 rounded-full transition-all duration-500 ".concat(step === i
                ? "w-8 bg-slate-900"
                : step > i
                    ? "w-2 bg-slate-300"
                    : "w-2 bg-slate-150")}/>); })}
      </div>

      {/* Step 1: Road Selection */}
      {step === 1 && (<div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl md:text-3xl font-serif text-slate-800 tracking-wide">
              どの道を歩んでいますか？
            </h1>
            <p className="text-sm text-slate-400">
              今のあなたに最も近い状態を選択してください
            </p>
          </div>

          <div className="space-y-3.5">
            {[
                { id: "beginner", label: "初任者ロード", desc: "仕事に慣れる、基本を習得する段階", icon: "🌱" },
                { id: "side-hustle", label: "副業ロード", desc: "本業とバランスをとりながら新しい軸を作る段階", icon: "💻" },
                { id: "resignation", label: "退職ロード", desc: "次のステップへ進むため、今を整え引き継ぐ段階", icon: "🚪" },
            ].map(function (road) { return (<button key={road.id} onClick={function () { return handleSelectRoad(road.id); }} className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-slate-350 hover:bg-slate-50/50 bg-white transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <span className="text-base">{road.icon}</span>
                      <span>{road.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">{road.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"/>
                </div>
              </button>); })}
          </div>
        </div>)}

      {/* Step 2: Philosophy */}
      {step === 2 && (<div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            <lucide_react_1.Sparkles className="w-5 h-5 stroke-[1.5]"/>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed font-serif">
              YOHAKUは、毎日の記録を整理し、小さく積み重ねる場所です。
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              ここに他のSNSのような競争や数字はありません。ただあなたが立ち止まり、余白を作り、次の一歩を踏み出すのを優しく見守るツールです。
            </p>
          </div>

          <div className="pt-4">
            <button onClick={function () { return setStep(3); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
              <span>はじめる</span>
              <lucide_react_1.ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </div>)}

      {/* Step 3: First Log */}
      {step === 3 && (<div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl md:text-3xl font-serif text-slate-800 tracking-wide">
              いま、どんな気持ちですか？
            </h1>
            <p className="text-sm text-slate-400">
              最初の一歩として、いま心にあることを少しだけ書いてみましょう
            </p>
          </div>

          <div className="relative rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
            <textarea value={firstLogText} onChange={function (e) { return setFirstLogText(e.target.value); }} placeholder="今気になっていることを書いてみる" className="w-full resize-none border-0 bg-transparent p-0 text-slate-800 placeholder:text-slate-300 focus:ring-0 text-base leading-relaxed outline-none" rows={4}/>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSaveFirstLog} disabled={!firstLogText.trim()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-30 transition-colors">
                <span>記録して進む</span>
                <lucide_react_1.ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>)}

      {/* Step 4: AI Connection */}
      {step === 4 && (<div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-slate-400 mb-2">
              <lucide_react_1.Key className="w-5 h-5 stroke-[1.5]"/>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-slate-800 tracking-wide">
              AI（Gemini）と接続する
            </h1>
            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              AIを接続すると、ログの自動整理や気づき・課題の抽出が利用できます
            </p>
          </div>

          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 font-mono tracking-wider uppercase">
                Gemini API Key
              </label>
              <input type="password" value={apiKey} onChange={function (e) { return setApiKey(e.target.value); }} placeholder="AI-key..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-350 focus:border-slate-400 focus:outline-none focus:ring-0"/>
              {keyError && (<p className="text-xs text-red-500 mt-1">{keyError}</p>)}
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <button onClick={handleConnectApiKey} disabled={testingKey || !apiKey.trim()} className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 transition-colors disabled:opacity-50 text-sm shadow-sm">
                {testingKey ? (<>
                    <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                    <span>接続テスト中...</span>
                  </>) : (<span>接続してはじめる</span>)}
              </button>

              <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-650 transition-colors py-2 font-mono">
                Skip (後で設定する)
              </button>
            </div>
          </div>
        </div>)}

      {/* Step 5: Completed Loading Screen */}
      {step === 5 && (<div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-1000">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500">
            <lucide_react_1.Sparkles className="w-6 h-6 stroke-[1.5]"/>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-serif text-slate-800">準備が整いました</h1>
            <p className="text-xs text-slate-400">YOHAKUの空間へ移動しています...</p>
          </div>
        </div>)}
    </div>);
}
// Quiet SVG chevron icon
function ChevronRightIcon(props) {
    return (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
    </svg>);
}
