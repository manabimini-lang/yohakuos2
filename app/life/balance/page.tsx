import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { analyzeLifeBalance } from "@/lib/lifeos";

export default async function LifeBalancePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const analysis = await analyzeLifeBalance(session.user.id);

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-light text-stone-600">バランス</h2>

            {analysis.confidence < 0.2 ? (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">{analysis.analysis}</p>
                    {analysis.gentleSuggestions.length > 0 && (
                        <p className="text-stone-300 text-sm font-light mt-2">{analysis.gentleSuggestions[0]}</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg p-5 border border-stone-200">
                        <p className="text-sm text-stone-600 font-light leading-relaxed">{analysis.analysis}</p>
                    </div>

                    {/* バランス指標 */}
                    <div className="grid grid-cols-2 gap-4">
                        {analysis.learningOverload !== null && (
                            <div className="bg-white rounded-lg p-4 border border-stone-200">
                                <p className="text-xs text-stone-400 font-light">学習過多</p>
                                <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-stone-400 rounded-full" style={{ width: `${analysis.learningOverload * 100}%` }} />
                                </div>
                                <p className="text-xs text-stone-400 mt-1">{Math.round(analysis.learningOverload * 100)}%</p>
                            </div>
                        )}
                        {analysis.exhaustionTendency !== null && (
                            <div className="bg-white rounded-lg p-4 border border-stone-200">
                                <p className="text-xs text-stone-400 font-light">疲弊傾向</p>
                                <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-stone-400 rounded-full" style={{ width: `${analysis.exhaustionTendency * 100}%` }} />
                                </div>
                                <p className="text-xs text-stone-400 mt-1">{Math.round(analysis.exhaustionTendency * 100)}%</p>
                            </div>
                        )}
                    </div>

                    {/* シグナル */}
                    {analysis.signals.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-stone-600">兆し</h3>
                            {analysis.signals.map((s, i) => (
                                <div key={i} className="bg-white rounded-lg p-3 border border-stone-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                                            {s.type}
                                        </span>
                                        <span className="text-[10px] text-stone-300">
                                            強度: {Math.round(s.intensity * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-500 font-light mt-1">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 静かな提案 */}
                    {analysis.gentleSuggestions.length > 0 && (
                        <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                            <h3 className="text-sm text-stone-500 font-medium mb-3">静かな提案</h3>
                            <ul className="space-y-1">
                                {analysis.gentleSuggestions.map((s, i) => (
                                    <li key={i} className="text-sm text-stone-400 font-light">· {s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}