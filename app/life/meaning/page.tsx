import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMeaningSignals, analyzeMeaningSignals } from "@/lib/lifeos";

export default async function LifeMeaningPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [signals, analysis] = await Promise.all([
        getMeaningSignals(session.user.id),
        analyzeMeaningSignals(session.user.id),
    ]);

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-light text-stone-600">意味の兆し</h2>

            {signals.length === 0 ? (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">まだ意味シグナルが抽出されていません。</p>
                    <p className="text-stone-300 text-sm font-light mt-2">内省や会話を続けると、ここに人生のパターンが現れます。</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-stone-400 font-light">{analysis.summary}</p>

                    {analysis.patterns.length > 0 && (
                        <div className="bg-white rounded-lg p-5 border border-stone-200">
                            <h3 className="text-sm font-medium text-stone-600 mb-3">パターン</h3>
                            <ul className="space-y-1">
                                {analysis.patterns.map((p, i) => (
                                    <li key={i} className="text-sm text-stone-500 font-light">· {p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.quietQuestions.length > 0 && (
                        <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                            <h3 className="text-sm font-medium text-stone-500 mb-3">静かな問い</h3>
                            <ul className="space-y-2">
                                {analysis.quietQuestions.map((q, i) => (
                                    <li key={i} className="text-sm text-stone-400 font-light italic">
                                        「{q}」
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-stone-600">シグナル一覧</h3>
                        {signals.map((s) => (
                            <div key={s.id} className="bg-white rounded-lg p-4 border border-stone-200">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                                        {s.signalType.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-[10px] text-stone-300">
                                        確度: {Math.round(s.confidence * 100)}%
                                    </span>
                                </div>
                                <p className="text-sm text-stone-500 font-light mt-2">{s.description}</p>
                                {s.areaType && (
                                    <span className="text-[10px] text-stone-300 mt-1 block">{s.areaType}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}