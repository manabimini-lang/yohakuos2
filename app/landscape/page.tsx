import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandscapePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { prisma } = await import("@/lib/prisma");
    const landscape = await prisma.innerLandscape.findFirst({
        where: { userId: session.user.id },
        orderBy: { generatedAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-light text-stone-600">Inner Landscape</h2>
                <span className="text-sm text-stone-300 font-light">静かな内面の風景</span>
            </div>

            {!landscape ? (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">まだ内面の風景が生成されていません。</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                        <h3 className="text-xs text-stone-400 font-light mb-2">季節の空気</h3>
                        <p className="text-sm text-stone-600 font-light leading-relaxed">{landscape.seasonalAir}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-stone-200">
                        <h3 className="text-xs text-stone-400 font-light mb-2">静かな流れ</h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(landscape.quietCurrents)
                                ? landscape.quietCurrents
                                    .filter((item): item is string => typeof item === "string")
                                    .map((t, i) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-stone-100 text-stone-500 rounded">{t}</span>
                                    ))
                                : null}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-stone-200">
                        <h3 className="text-xs text-stone-400 font-light mb-2">戻ってくる問い</h3>
                        <ul className="list-disc pl-5 text-sm text-stone-600 leading-relaxed">
                            {Array.isArray(landscape.returningQuestions)
                                ? landscape.returningQuestions
                                    .filter((item): item is string => typeof item === "string")
                                    .map((q, i) => (
                                        <li key={i} className="mb-1">{q}</li>
                                    ))
                                : null}
                        </ul>
                    </div>

                    <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                        <h3 className="text-xs text-stone-400 font-light mb-2">共鳴の天気</h3>
                        <p className="text-sm text-stone-600 font-light">{landscape.resonanceWeather}</p>
                    </div>

                    {Array.isArray(landscape.philosophyEchoes) && landscape.philosophyEchoes.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                            <h3 className="text-xs text-stone-400 font-light mb-2">哲学の残響</h3>
                            <div className="space-y-2 text-sm text-stone-600">
                                {landscape.philosophyEchoes
                                    .filter((item): item is string => typeof item === "string")
                                    .map((e, i) => (
                                        <p key={i} className="font-light">{e}</p>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
