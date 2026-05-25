import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { DirectionReflectionInfo } from "@/lib/lifeos";

export default async function LifeDirectionPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const directions = await prisma.directionReflection.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-light text-stone-600">方向性</h2>

            {directions.length === 0 ? (
                <div className="bg-white rounded-lg p-8 border border-stone-200 text-center">
                    <p className="text-stone-400 font-light">
                        まだ方向性の振り返りが記録されていません。
                    </p>
                    <p className="text-stone-300 text-sm font-light mt-2">
                        日々の内省を重ねると、静かに方向性が見えてきます。
                    </p>
                </div>
            ) : (
                directions.map((dir) => (
                    <div
                        key={dir.id}
                        className="bg-white rounded-lg p-5 border border-stone-200 hover:border-stone-300 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                                {dir.period}
                            </span>
                            <span className="text-[10px] text-stone-300">
                                {dir.createdAt.toLocaleDateString("ja-JP")}
                            </span>
                            <span className="text-[10px] text-stone-300">
                                確度: {Math.round(dir.confidence * 100)}%
                            </span>
                        </div>

                        <p className="text-sm text-stone-600 font-light mb-3">
                            {dir.direction}
                        </p>

                        <p className="text-sm text-stone-400 font-light">
                            大切にしたいこと: {dir.intention}
                        </p>

                        {dir.values && Array.isArray(dir.values) && (dir.values as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {(dir.values as string[]).map((value: string, i: number) => (
                                    <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 bg-stone-50 text-stone-400 rounded"
                                    >
                                        {value}
                                    </span>
                                ))}
                            </div>
                        )}

                        {dir.quietWish && (
                            <p className="text-xs text-stone-300 font-light italic mt-3">
                                静かな願い: {dir.quietWish}
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}