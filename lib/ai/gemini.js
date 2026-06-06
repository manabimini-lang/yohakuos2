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
exports.getApiCredentials = getApiCredentials;
exports.getUserOwnedApiCredentials = getUserOwnedApiCredentials;
exports.generateJSON = generateJSON;
exports.generateText = generateText;
exports.validateApiKey = validateApiKey;
var generative_ai_1 = require("@google/generative-ai");
var prisma_1 = require("@/lib/prisma");
var encryption_1 = require("@/lib/encryption");
var GEMINI_MODEL = 'gemini-2.5-flash';
var STARTER_GEMINI_API_KEY = process.env.STARTER_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
function incrementTokenUsage(userId, tokenCount) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.prisma.userAISettings.update({
                            where: { userId: userId },
                            data: {
                                dailyTokenUsage: { increment: tokenCount },
                                monthlyTokenUsage: { increment: tokenCount },
                            },
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getFallbackApiCredentials() {
    if (!STARTER_GEMINI_API_KEY) {
        throw new Error('GEMINI APIキーが設定されていません。設定画面からAPIキーを入力するか、環境変数を設定してください。');
    }
    return {
        apiKey: STARTER_GEMINI_API_KEY,
        modelName: GEMINI_MODEL,
    };
}
function getApiCredentials(options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            if (typeof options === 'string') {
                return [2 /*return*/, getApiCredentialsFromUserId(options)];
            }
            if (options && (options.apiKey || options.modelName)) {
                return [2 /*return*/, {
                        apiKey: options.apiKey || STARTER_GEMINI_API_KEY || '',
                        modelName: GEMINI_MODEL,
                    }];
            }
            return [2 /*return*/, getApiCredentialsFromUserId(options === null || options === void 0 ? void 0 : options.userId, (_a = options === null || options === void 0 ? void 0 : options.allowEnvFallback) !== null && _a !== void 0 ? _a : false)];
        });
    });
}
function getUserOwnedApiCredentials(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, now, lastReset, dailyUsage, monthlyUsage, needsUpdate, isDifferentDay, isDifferentMonth, decrypted, keyRecord;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId) {
                        return [2 /*return*/, null];
                    }
                    console.log("LOAD USER OWNED GEMINI CREDENTIALS", { userId: userId });
                    return [4 /*yield*/, prisma_1.prisma.userAISettings.findUnique({
                            where: { userId: userId },
                        })];
                case 1:
                    settings = _a.sent();
                    if (!settings) return [3 /*break*/, 4];
                    now = new Date();
                    lastReset = settings.lastUsageReset ? new Date(settings.lastUsageReset) : null;
                    dailyUsage = settings.dailyTokenUsage;
                    monthlyUsage = settings.monthlyTokenUsage;
                    needsUpdate = false;
                    isDifferentDay = !lastReset ||
                        now.getDate() !== lastReset.getDate() ||
                        now.getMonth() !== lastReset.getMonth() ||
                        now.getFullYear() !== lastReset.getFullYear();
                    isDifferentMonth = !lastReset ||
                        now.getMonth() !== lastReset.getMonth() ||
                        now.getFullYear() !== lastReset.getFullYear();
                    if (isDifferentDay) {
                        dailyUsage = 0;
                        needsUpdate = true;
                    }
                    if (isDifferentMonth) {
                        monthlyUsage = 0;
                        needsUpdate = true;
                    }
                    if (!needsUpdate) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.prisma.userAISettings.update({
                            where: { userId: userId },
                            data: {
                                dailyTokenUsage: dailyUsage,
                                monthlyTokenUsage: monthlyUsage,
                                lastUsageReset: now,
                            },
                        }).catch(function (e) { return console.error("[GEMINI] Failed to reset token usage:", e); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (settings.isEnabled) {
                        if (dailyUsage >= 100000) {
                            throw new Error("本日の一日利用量制限（100,000トークン）に達しました。");
                        }
                        if (monthlyUsage >= 2000000) {
                            throw new Error("当月の月間利用量制限（2,000,000トークン）に達しました。");
                        }
                        if (settings.encryptedApiKey) {
                            decrypted = (0, encryption_1.decryptKey)(settings.encryptedApiKey);
                            console.log("FOUND USER GEMINI KEY FROM SETTINGS", {
                                userId: userId,
                                model: GEMINI_MODEL,
                            });
                            return [2 /*return*/, {
                                    apiKey: decrypted,
                                    modelName: GEMINI_MODEL,
                                }];
                        }
                    }
                    _a.label = 4;
                case 4: return [4 /*yield*/, prisma_1.prisma.userApiKey.findUnique({
                        where: {
                            userId_apiProvider: {
                                userId: userId,
                                apiProvider: "gemini",
                            },
                        },
                    })];
                case 5:
                    keyRecord = _a.sent();
                    if (keyRecord === null || keyRecord === void 0 ? void 0 : keyRecord.encryptedKey) {
                        console.log("FOUND USER GEMINI KEY FROM LEGACY STORAGE", { userId: userId });
                        return [2 /*return*/, {
                                apiKey: (0, encryption_1.decryptKey)(keyRecord.encryptedKey),
                                modelName: GEMINI_MODEL,
                            }];
                    }
                    console.log("NO USER GEMINI CREDENTIALS FOUND", { userId: userId });
                    return [2 /*return*/, null];
            }
        });
    });
}
function getApiCredentialsFromUserId(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, allowEnvFallback) {
        var credentials;
        if (allowEnvFallback === void 0) { allowEnvFallback = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId) return [3 /*break*/, 2];
                    return [4 /*yield*/, getUserOwnedApiCredentials(userId)];
                case 1:
                    credentials = _a.sent();
                    if (credentials) {
                        return [2 /*return*/, credentials];
                    }
                    if (allowEnvFallback) {
                        return [2 /*return*/, getFallbackApiCredentials()];
                    }
                    throw new Error("Gemini APIキーが設定されていません。設定画面からユーザー固有のAPIキーを入力してください。");
                case 2: return [2 /*return*/, getFallbackApiCredentials()];
            }
        });
    });
}
/**
 * AIクライアントを取得する。
 */
function getClient(options) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, modelName, genAI, client;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getApiCredentials(options)];
                case 1:
                    apiKey = (_a.sent()).apiKey;
                    modelName = GEMINI_MODEL;
                    console.log("CREATE GEMINI CLIENT", {
                        modelName: modelName,
                        hasApiKey: !!apiKey,
                        source: typeof options === 'string' ? 'userId' : (options === null || options === void 0 ? void 0 : options.apiKey) ? 'direct' : 'env/user-settings',
                    });
                    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                    client = genAI.getGenerativeModel({ model: modelName });
                    return [2 /*return*/, { client: client, modelName: modelName }];
            }
        });
    });
}
function generateJSON(prompt, systemInstruction, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, client, modelName, result, response, text, jsonMatch, jsonStr, data, tokenUsed, userId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getClient(options)];
                case 1:
                    _a = _b.sent(), client = _a.client, modelName = _a.modelName;
                    return [4 /*yield*/, client.generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            systemInstruction: systemInstruction
                                ? { role: 'user', parts: [{ text: systemInstruction }] }
                                : undefined,
                            generationConfig: {
                                temperature: 0.3,
                                topK: 32,
                                topP: 0.95,
                                maxOutputTokens: 2048,
                            },
                        })];
                case 2:
                    result = _b.sent();
                    response = result.response;
                    text = response.text();
                    jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/{[\s\S]*?}/);
                    jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
                    data = JSON.parse(jsonStr.trim());
                    tokenUsed = Math.ceil((prompt.length + text.length) / 4);
                    userId = typeof options === 'string' ? options : options === null || options === void 0 ? void 0 : options.userId;
                    if (userId) {
                        incrementTokenUsage(userId, tokenUsed).catch(function (err) {
                            console.error("[GEMINI] Failed to increment token usage:", err);
                        });
                    }
                    return [2 /*return*/, {
                            data: data,
                            usage: {
                                text: text,
                                tokenUsed: tokenUsed,
                                model: modelName,
                            },
                        }];
            }
        });
    });
}
function generateText(prompt, systemInstruction, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, client, modelName, result, response, text, tokenUsed, userId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getClient(options)];
                case 1:
                    _a = _b.sent(), client = _a.client, modelName = _a.modelName;
                    return [4 /*yield*/, client.generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            systemInstruction: systemInstruction
                                ? { role: 'user', parts: [{ text: systemInstruction }] }
                                : undefined,
                            generationConfig: {
                                temperature: 0.5,
                                maxOutputTokens: 1024,
                            },
                        })];
                case 2:
                    result = _b.sent();
                    response = result.response;
                    text = response.text();
                    tokenUsed = Math.ceil((prompt.length + text.length) / 4);
                    userId = typeof options === 'string' ? options : options === null || options === void 0 ? void 0 : options.userId;
                    if (userId) {
                        incrementTokenUsage(userId, tokenUsed).catch(function (err) {
                            console.error("[GEMINI] Failed to increment token usage:", err);
                        });
                    }
                    return [2 /*return*/, { text: text, tokenUsed: tokenUsed, model: modelName }];
            }
        });
    });
}
/**
 * APIキーの接続確認を行う。
 * 実際にGemini APIを呼び出して疎通を確認する。
 */
function validateApiKey(options) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, testClient, testModel, method, userId, settings, oauthRecord, legacyRecord, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 14, , 15]);
                    return [4 /*yield*/, getApiCredentials(options)];
                case 1:
                    apiKey = (_b.sent()).apiKey;
                    testClient = new generative_ai_1.GoogleGenerativeAI(apiKey);
                    testModel = testClient.getGenerativeModel({ model: GEMINI_MODEL });
                    // 軽量なテスト呼び出し
                    return [4 /*yield*/, testModel.generateContent({
                            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
                            generationConfig: { maxOutputTokens: 1 },
                        })];
                case 2:
                    // 軽量なテスト呼び出し
                    _b.sent();
                    method = null;
                    userId = typeof options === 'string' ? options : options === null || options === void 0 ? void 0 : options.userId;
                    if (!(typeof options === 'object' && options !== null && options.apiKey)) return [3 /*break*/, 3];
                    method = 'apikey';
                    return [3 /*break*/, 13];
                case 3:
                    if (!userId) return [3 /*break*/, 12];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 10, , 11]);
                    return [4 /*yield*/, prisma_1.prisma.userAISettings.findUnique({
                            where: { userId: userId },
                        })];
                case 5:
                    settings = _b.sent();
                    if (!(settings && settings.isEnabled)) return [3 /*break*/, 6];
                    method = 'apikey';
                    return [3 /*break*/, 9];
                case 6: return [4 /*yield*/, prisma_1.prisma.userApiKey.findUnique({
                        where: {
                            userId_apiProvider: { userId: userId, apiProvider: "gemini_oauth" },
                        },
                    })];
                case 7:
                    oauthRecord = _b.sent();
                    return [4 /*yield*/, prisma_1.prisma.userApiKey.findUnique({
                            where: {
                                userId_apiProvider: { userId: userId, apiProvider: "gemini" },
                            },
                        })];
                case 8:
                    legacyRecord = _b.sent();
                    if (oauthRecord === null || oauthRecord === void 0 ? void 0 : oauthRecord.encryptedKey) {
                        method = 'oauth';
                    }
                    else if (legacyRecord === null || legacyRecord === void 0 ? void 0 : legacyRecord.encryptedKey) {
                        method = 'apikey';
                    }
                    _b.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    _a = _b.sent();
                    method = 'apikey';
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (process.env.GEMINI_API_KEY) {
                        method = 'env';
                    }
                    _b.label = 13;
                case 13: return [2 /*return*/, { connected: true, method: method }];
                case 14:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            connected: false,
                            method: null,
                            error: error_1.message || 'APIキーの検証に失敗しました',
                        }];
                case 15: return [2 /*return*/];
            }
        });
    });
}
