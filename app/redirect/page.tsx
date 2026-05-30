import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  // If the account was created within the last 2 minutes, treat as a new user
  const isNewUser = Date.now() - new Date(user.createdAt).getTime() < 120_000;

  if (isNewUser) {
    redirect("/onboarding");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/member");
  }
}
