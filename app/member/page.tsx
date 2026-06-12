import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ホーム - YOHAKU",
  description: "静かな振り返り空間",
};

export default async function MemberPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  redirect("/inbox");
}
