import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContentShareClient } from "@/components/content/share-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - 知見を共有する",
  description: "有益な外部コンテンツを共有する",
};

export default async function ContentSharePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <ContentShareClient />
    </div>
  );
}
