import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentSeasonalPeriod } from "@/lib/lifeos";

export default async function LifeSeasonalPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const current = getCurrentSeasonalPeriod();

    // Get latest seasonal summary from DB
    const { prisma } = await import("@/lib/prisma");
    const latestSummary = await prisma.seasonalSummary.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-light text-stone-600">季節の振り返り</h2>
                <span className="text-sm text-stone-300 font-light">
                    {current.season} {current.year}
                </span>
            </div>

            <div className="bg-white rounded-lg p-5 border border-stone-200">
                <p className="text-xs text-stone-400 font-light mb-2">現在の季節</p>
                <p className="text-base text-stone-600 font-light">
                    {current.season === "spring" ? "春" :
                        current.season === "summer" ? "夏" :
                            current.season === "autumn" ? "秋" : "冬"} {current.year}
                </p>
                <p className="text-xs text-stone-300 mt-1">
                    {current.startDate.toLocaleDateString("ja-JP")} — {current.endDate.toLocaleDateString("ja-JP")}
                </p>
            </div>

            {latestSummary ? (
                <div className="space-y-4">
                    <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                        <h3 className="text-sm text-stone-500 font-medium mb-2">
                            {latestSummary.period}
                        </h3>
                        <p className="text-sm text-stone-600 font-light leading-relaxed">
                            {latestSummary.summary}
                        </p>
                    </div>

                    {Array.isArray(latestSummary.themes) && latestSummary.themes.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                            <h3 className="text-xs text-stone-400 font-light mb-2">テーマ</h3>
                            <div className="flex flex-wrap gap-2">
                                {(latestSummary.themes as string[]).map((theme: string, i: number) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-stone-100 text-stone-500 rounded">
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">まだ季節の振り返りが生成されていません。</p>
                </div>
            )}
        </div>
    );
}