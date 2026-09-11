/** The only account allowed to access the administrative surface. */
export const ADMIN_ACCESS_EMAIL = "manabi.mini@gmail.com";

export function isAdminAccessEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_ACCESS_EMAIL;
}

export function isAdminAccessUser(user?: { email?: string | null; role?: string | null } | null): boolean {
  return isAdminAccessEmail(user?.email);
}
