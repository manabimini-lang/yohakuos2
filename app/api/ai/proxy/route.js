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
exports.dynamic = void 0;
exports.POST = POST;
var server_1 = require("next/server");
var auth_1 = require("@/lib/auth");
var encryption_1 = require("@/lib/encryption");
var api_key_repository_1 = require("@/lib/repositories/api-key.repository");
exports.dynamic = "force-dynamic";
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var session, userId, body, input, systemPrompt, roadContext, oauthKeyRecord, legacyKeyRecord, accessToken, isOauth, decryptedPayload, tokenData, clientId, clientSecret, refreshResponse, newTokens, e_1, systemInstruction, payload, apiUrl, headers, response, errorText, data, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 22, , 23]);
                    return [4 /*yield*/, (0, auth_1.auth)()];
                case 1:
                    session = _b.sent();
                    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
                        return [2 /*return*/, new server_1.NextResponse("Unauthorized", { status: 401 })];
                    }
                    if (session.user.plan !== "premium" && session.user.plan !== "PREMIUM") {
                        return [2 /*return*/, new server_1.NextResponse("Forbidden - Premium required", { status: 403 })];
                    }
                    userId = session.user.id;
                    return [4 /*yield*/, req.json()];
                case 2:
                    body = _b.sent();
                    input = body.input, systemPrompt = body.systemPrompt, roadContext = body.roadContext;
                    if (!input) {
                        return [2 /*return*/, new server_1.NextResponse("Input is required", { status: 400 })];
                    }
                    return [4 /*yield*/, api_key_repository_1.apiKeyRepository.findByUserIdAndProvider(userId, "gemini_oauth")];
                case 3:
                    oauthKeyRecord = _b.sent();
                    return [4 /*yield*/, api_key_repository_1.apiKeyRepository.findByUserIdAndProvider(userId, "gemini")];
                case 4:
                    legacyKeyRecord = _b.sent();
                    if (!oauthKeyRecord && !legacyKeyRecord) {
                        return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "Gemini APIキーまたはGoogle連携が設定されていません。" }), { status: 401, headers: { "Content-Type": "application/json" } })];
                    }
                    accessToken = "";
                    isOauth = false;
                    if (!(oauthKeyRecord === null || oauthKeyRecord === void 0 ? void 0 : oauthKeyRecord.encryptedKey)) return [3 /*break*/, 16];
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 14, , 15]);
                    decryptedPayload = (0, encryption_1.decryptKey)(oauthKeyRecord.encryptedKey);
                    tokenData = JSON.parse(decryptedPayload);
                    if (!(Date.now() >= tokenData.expires_at - 60000)) return [3 /*break*/, 13];
                    if (!tokenData.refresh_token) return [3 /*break*/, 12];
                    clientId = process.env.GOOGLE_CLIENT_ID;
                    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
                    if (!(clientId && clientSecret)) return [3 /*break*/, 11];
                    return [4 /*yield*/, fetch("https://oauth2.googleapis.com/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: new URLSearchParams({
                                client_id: clientId,
                                client_secret: clientSecret,
                                refresh_token: tokenData.refresh_token,
                                grant_type: "refresh_token",
                            }),
                        })];
                case 6:
                    refreshResponse = _b.sent();
                    if (!refreshResponse.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, refreshResponse.json()];
                case 7:
                    newTokens = _b.sent();
                    tokenData.access_token = newTokens.access_token;
                    if (newTokens.refresh_token) {
                        tokenData.refresh_token = newTokens.refresh_token;
                    }
                    tokenData.expires_at = Date.now() + newTokens.expires_in * 1000;
                    return [4 /*yield*/, api_key_repository_1.apiKeyRepository.upsert(userId, (0, encryption_1.encryptKey)(JSON.stringify(tokenData)), "gemini_oauth")];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, api_key_repository_1.apiKeyRepository.delete(userId, "gemini_oauth")];
                case 10:
                    _b.sent();
                    return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "Google連携の有効期限が切れました。再接続してください。" }), { status: 401, headers: { "Content-Type": "application/json" } })];
                case 11: return [3 /*break*/, 13];
                case 12: return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "Google連携の有効期限が切れました。再接続してください。" }), { status: 401, headers: { "Content-Type": "application/json" } })];
                case 13:
                    accessToken = tokenData.access_token;
                    isOauth = true;
                    return [3 /*break*/, 15];
                case 14:
                    e_1 = _b.sent();
                    console.error("Failed to parse or refresh OAuth token", e_1);
                    return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "Google連携情報の読み込みに失敗しました。再接続してください。" }), { status: 401, headers: { "Content-Type": "application/json" } })];
                case 15: return [3 /*break*/, 17];
                case 16:
                    if (legacyKeyRecord === null || legacyKeyRecord === void 0 ? void 0 : legacyKeyRecord.encryptedKey) {
                        try {
                            accessToken = (0, encryption_1.decryptKey)(legacyKeyRecord.encryptedKey);
                        }
                        catch (e) {
                            return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "APIキーの読み込みに失敗しました。" }), { status: 401, headers: { "Content-Type": "application/json" } })];
                        }
                    }
                    _b.label = 17;
                case 17:
                    systemInstruction = systemPrompt || "\u3042\u306A\u305F\u306FYOHAKU AI\u3067\u3059\u3002\n\u76EE\u7684\uFF1A\u30E6\u30FC\u30B6\u30FC\u3092\u5C0E\u304F\u306E\u3067\u306F\u306A\u304F\u3001\u72B6\u614B\u3092\u6574\u7406\u3059\u308B\u3002\n".concat(roadContext || "", "\n\n\u51FA\u529B\u5F62\u5F0F\uFF1A\n## \u72B6\u614B\u6574\u7406\n\u73FE\u5728\u306E\u72B6\u614B\u3092\u77ED\u304F\u6574\u7406\n\n## \u6C17\u3065\u304D\n\u884C\u52D5\u3084\u611F\u60C5\u306E\u610F\u5473\u3065\u3051\n\n## \u5C0F\u3055\u306A\u6B21\u306E\u4E00\u6B69\n\u8CA0\u8377\u306E\u5C0F\u3055\u3044\u884C\u52D5\n\n\u5236\u7D04\uFF1A\n- 3\u301C5\u884C\n- \u9577\u6587\u7981\u6B62\n- \u547D\u4EE4\u7981\u6B62\n- \u512A\u3057\u304F\u6574\u7406\u3059\u308B");
                    payload = {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        contents: [{ role: "user", parts: [{ text: input.trim() }] }]
                    };
                    apiUrl = isOauth
                        ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
                        : "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=".concat(accessToken);
                    headers = {
                        "Content-Type": "application/json"
                    };
                    if (isOauth) {
                        headers["Authorization"] = "Bearer ".concat(accessToken);
                    }
                    return [4 /*yield*/, fetch(apiUrl, {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify(payload)
                        })];
                case 18:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 20];
                    return [4 /*yield*/, response.text()];
                case 19:
                    errorText = _b.sent();
                    console.error("Gemini API Error:", errorText);
                    return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "AIの生成に失敗しました。" }), { status: 500, headers: { "Content-Type": "application/json" } })];
                case 20: return [4 /*yield*/, response.json()];
                case 21:
                    data = _b.sent();
                    return [2 /*return*/, server_1.NextResponse.json(data)];
                case 22:
                    error_1 = _b.sent();
                    console.error("[AI_PROXY]", error_1);
                    return [2 /*return*/, new server_1.NextResponse(JSON.stringify({ error: "内部サーバーエラーが発生しました。" }), { status: 500, headers: { "Content-Type": "application/json" } })];
                case 23: return [2 /*return*/];
            }
        });
    });
}
