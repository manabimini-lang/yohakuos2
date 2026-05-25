import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { analyzeEnergyTrend } from "@/lib/lifeos";

export default async function LifeEnergyPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const trend = await analyzeEnergyTrend(session.user.id);

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-light text-stone-600">エネルギー</h2>

            {trend.recentStates.length === 0 ? (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">まだエネルギー記録がありません。</p>
                    <p className="text-stone-300 text-sm font-light mt-2">日々の記録を始めると、エネルギーの流れが見えてきます。</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                            <p className="text-xs text-stone-400 font-light">記録数</p>
                            <p className="text-xl font-light text-stone-700 mt-1">{trend.recentStates.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                            <p className="text-xs text-stone-400 font-light">平均強度</p>
                            <p className="text-xl font-light text-stone-700 mt-1">{trend.averageIntensity}/10</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                            <p className="text-xs text-stone-400 font-light">主な状態</p>
                            <p className="text-xl font-light text-stone-700 mt-1">
                                {trend.dominantState ? trend.dominantState.replace(/_/g, " ") : "—"}
                            </p>
                        </div>
                    </div>

                    {trend.shiftIndication && (
                        <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                            <p className="text-sm text-stone-500 font-light">{trend.shiftIndication}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-stone-600">最近の状態</h3>
                        {trend.recentStates.slice(0, 15).map((state) => (
                            <div key={state.id} className="bg-white rounded-lg p-3 border border-stone-200 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-stone-300" />
                                <span className="text-sm text-stone-500 font-light flex-1">
                                    {state.state.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-stone-400">{state.intensity}/10</span>
                                {state.note && <span className="text-xs text-stone-300">{state.note}</span>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}