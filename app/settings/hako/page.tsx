import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HakoConnectionClient } from "@/components/settings/hako-connection-client";

export const dynamic = "force-dynamic";

export default async function HakoConnectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <HakoConnectionClient />;
}
