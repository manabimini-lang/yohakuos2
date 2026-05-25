// ===================================================
// YOHAKU Companion — Main Page
// ===================================================
//
// 「Chat UI」ではなく、“静かな対話空間”
//

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompanionChat from "@/components/companion/companion-chat";

export const metadata = {
    title: "静かな対話 | YOHAKU Companion",
    description: "YOHAKU Companion - 人生文脈を理解した静かな伴走者",
};

export default async function CompanionPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="h-screen flex flex-col">
                <CompanionChat />
            </div>
        </div>
    );
}