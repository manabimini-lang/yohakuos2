import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getQuietPlans, generateQuietSuggestions } from "@/lib/lifeos";

export default async function LifePlanningPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [plans, suggestions] = await Promise.all([
        getQuietPlans(session.user.id),
        generateQuietSuggestions(session.user.id),
    ]);

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-light text-stone-600">静かな計画</h2>

            <p className="text-xs text-stone-400 font-light">
                計画を強制しません。やってもやらなくても、どちらでもいいことだけを集めています。
            </p>

            {/* Suggestions */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-5 border border-stone-200">
                    <h3 className="text-xs text-stone-400 font-light mb-2">小さな次の一歩</h3>
                    <ul className="space-y-2">
                        {suggestions.smallNextSteps.map((step, i) => (
                            <li key={i} className="text-sm text-stone-500 font-light">· {step}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white rounded-lg p-5 border border-stone-200">
                    <h3 className="text-xs text-stone-400 font-light mb-2">静かな意図</h3>
                    <ul className="space-y-2">
                        {suggestions.quietIntentions.map((intent, i) => (
                            <li key={i} className="text-sm text-stone-500 font-light">· {intent}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white rounded-lg p-5 border border-stone-200">
                    <h3 className="text-xs text-stone-400 font-light mb-2">任意の内省</h3>
                    <ul className="space-y-2">
                        {suggestions.optionalReflections.map((ref, i) => (
                            <li key={i} className="text-sm text-stone-500 font-light">· {ref}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Saved Plans */}
            {plans.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-stone-600">保存した意図</h3>
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-lg p-4 border border-stone-200">
                            <p className="text-sm text-stone-600 font-light">{plan.intention}</p>
                            {plan.nextStep && (
                                <p className="text-xs text-stone-400 font-light mt-1">
                                    次の一歩: {plan.nextStep}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                {plan.isOptional && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-400 rounded">
                                        任意
                                    </span>
                                )}
                                {plan.isCompleted && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-stone-50 text-stone-400 rounded">
                                        完了
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}