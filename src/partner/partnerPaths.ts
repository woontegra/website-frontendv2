/**
 * Partner portal path helpers.
 * - Path mode (main site / local Vite): /partner , /partner/auth
 * - Subdomain mode (partner.bilirkisihesap.com): / , /auth
 */

const DEFAULT_PARTNER_HOST = 'partner.bilirkisihesap.com';

export function getPartnerPortalHost(): string {
  const fromEnv = (import.meta.env.VITE_PARTNER_PORTAL_HOST as string | undefined)?.trim();
  return fromEnv || DEFAULT_PARTNER_HOST;
}

export function isPartnerHost(hostname: string = window.location.hostname): boolean {
  const expected = getPartnerPortalHost().toLowerCase();
  const host = hostname.toLowerCase();
  if (host === expected) return true;
  // Local subdomain experiments (optional)
  if (host === 'partner.localhost' || host.endsWith('.partner.localhost')) return true;
  return false;
}

export function partnerHomePath(): string {
  return isPartnerHost() ? '/' : '/partner';
}

export function partnerAuthPath(): string {
  return isPartnerHost() ? '/auth' : '/partner/auth';
}
