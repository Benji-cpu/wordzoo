/**
 * Shared admin gating.
 *
 * The `ADMIN_EMAILS` check was previously duplicated inline across ~13 call
 * sites, and roughly half of those compared case-sensitively while the rest
 * lowercased both sides. A mixed-case Google address therefore bypassed
 * premium limits (billing-service lowercased) while being denied the admin UI
 * (the route handlers did not). One helper, always lowercased, is the fix.
 *
 * Deliberately dependency-free — no `@/lib/auth`, no DB — so the pedagogy flag
 * resolver, the billing service, route handlers and server components can all
 * import it without dragging NextAuth or the Neon client into their graphs.
 */

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
