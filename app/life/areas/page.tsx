// ===================================================
// YOHAKU Life OS — Life Areas Page
// ===================================================
//
// 人生の8領域を静かに見渡す。
// タスク管理化禁止。
//

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLifeAreaSummaries } from "@/lib/lifeos";

export default async function LifeAreasPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const areas = await getLifeAreaSummaries(session.user.id);

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-light text-stone-600">人生領域</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {areas.map((area) => (
                    <div
                        key={area.type}
                        className="bg-white rounded-lg p-5 border border-stone-200 hover:border-stone-300 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-medium text-stone-700">
                                    {area.title}
                                </h3>
                                {area.description && (
                                    <p className="text-xs text-stone-400 font-light mt-0.5">
                                        {area.description}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-stone-300">
                                {area.recentActivity > 0
                                    ? `${area.recentActivity}件`
                                    : "—"}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                            {area.averageEnergy !== null && (
                                <div className="text-xs text-stone-400">
                                    平均エネルギー: <span className="text-stone-600">{area.averageEnergy}/10</span>
                                </div>
                            )}
                        </div>

                        {area.recentSignals.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                                <p className="text-[10px] text-stone-300 font-light mb-1">最近の兆し:</p>
                                {area.recentSignals.slice(0, 2).map((signal) => (
                                    <p key={signal.id} className="text-xs text-stone-400 font-light">
                                        {signal.description.slice(0, 60)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}