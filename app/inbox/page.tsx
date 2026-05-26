import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InboxGrid } from "@/components/capture/InboxGrid";
import { EmptyInbox } from "@/components/capture/EmptyInbox";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox | YOHAKU",
};

export default async function InboxPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/"); // Or redirect to a login page if one exists
  }

  const items = await prisma.contentItem.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111] pb-32">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <h1 className="text-2xl md:text-3xl font-light text-notion-text dark:text-white tracking-wide">
            Inbox
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm md:text-base">
            静かに集められた、あなたの余白。
          </p>
        </header>

        {items.length > 0 ? (
          <InboxGrid items={items} />
        ) : (
          <EmptyInbox />
        )}
      </div>
    </main>
  );
}
