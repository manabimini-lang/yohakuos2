import { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      plan: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    plan?: string;
  }
}
