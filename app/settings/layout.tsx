import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  redirect("/member/settings");
}
