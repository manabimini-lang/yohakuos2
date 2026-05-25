// ===================================================
// YOHAKU Companion — Weekly Reflection
// ===================================================
//
// 週次振り返り: 学び、感情、継続、変化を会話形式で
//

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WeeklyReflectionClient from "@/components/companion/weekly-reflection";

export const metadata = {
    title: "週次振り返り | YOHAKU Companion",
    description: "今週の学びと変化を振り返る静かな時間",
};

export default async function WeeklyReflectionPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-light text-gray-800 mb-2">
                    週次振り返り
                </h1>
                <p className="text-sm text-gray-400 mb-8">
                    この1週間を、静かに振り返ってみましょう
                </p>
                <WeeklyReflectionClient />
            </div>
        </div>
    );
}