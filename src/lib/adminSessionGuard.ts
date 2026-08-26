import { clearAdminToken, getAdminToken } from '@/lib/adminAuth';

const LOGIN_PATH = '/admin/v2/login';

let redirectScheduled = false;

/**
 * Auth-token failures (missing/invalid/expired) — NOT role/authorization failures.
 * Keeps backwards compatibility with older backends that returned 403 + these messages.
 */
export function isCmsAdminAuthTokenFailure(
  status: number,
  message: string | null | undefined,
): boolean {
  if (status === 401) return true;
  if (status !== 403) return false;
  if (!message) return false;
  const m = message.toLocaleLowerCase('tr-TR');
  return (
    m.includes('token süresi dolmuş') ||
    m.includes('geçersiz token') ||
    m.includes("yetkilendirme token'ı bulunamadı") ||
    m.includes('yetkilendirme tokenı bulunamadı') ||
    m.includes('token expired') ||
    m.includes('invalid token') ||
    m.includes('jwt expired')
  );
}

function isAuthLoginRequest(path: string): boolean {
  const p = path.toLowerCase();
  return (
    p.includes('/api/auth/login') ||
    p.includes('/api/auth/public/login') ||
    p.includes('/api/auth/register')
  );
}

/** Partner portal uses cookie session — never treat as CMS admin auth failure. */
function isPartnerApiRequest(path: string): boolean {
  const p = path.toLowerCase().split('?')[0] ?? '';
  return p === '/api/partner' || p.startsWith('/api/partner/');
}

/**
 * On auth-token failure: clear CMS admin localStorage token and send user to login.
 * Does not run for authorization 403 (valid token, insufficient role).
 * Does not run for /api/partner/* (separate HttpOnly partner session).
 */
export function handleCmsAdminAuthFailure(path: string, status: number, message: string | null): void {
  if (typeof window === 'undefined') return;
  if (isAuthLoginRequest(path)) return;
  if (isPartnerApiRequest(path)) return;
  if (!getAdminToken()) return;
  if (!isCmsAdminAuthTokenFailure(status, message)) return;

  clearAdminToken();

  if (window.location.pathname.startsWith(LOGIN_PATH)) return;
  if (redirectScheduled) return;
  redirectScheduled = true;
  window.location.assign(LOGIN_PATH);
}

/** Test helper */
export function resetCmsAdminAuthRedirectGate(): void {
  redirectScheduled = false;
}
