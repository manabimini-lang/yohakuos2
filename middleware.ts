import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  canAccessAdmin,
  canAccessMember,
  canAccessPremium,
  type UserRole,
} from "@/lib/permissions";

const LOGIN_PATH = "/login";
const FORBIDDEN_PATH = "/forbidden";

const toLogin = (url: URL) => NextResponse.redirect(new URL(LOGIN_PATH, url));
const toForbidden = (url: URL) =>
  NextResponse.redirect(new URL(FORBIDDEN_PATH, url));

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role as UserRole | undefined;

  if (!session?.user) {
    return toLogin(nextUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!canAccessAdmin(role)) {
      return toForbidden(nextUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/member")) {
    if (!canAccessMember(role)) {
      return toForbidden(nextUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/premium")) {
    if (!canAccessPremium(role)) {
      return toForbidden(nextUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/member/:path*", "/premium/:path*"],
};
