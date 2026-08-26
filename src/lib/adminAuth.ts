import { normalizeAdminToken } from './adminTokenDebug';
import { isAccessTokenExpired } from './adminTokenDebug';

/** Mevcut website-frontend admin paneli ile aynı anahtar */
const ADMIN_TOKEN_KEY = 'token';

export { normalizeAdminToken, isAccessTokenExpired };

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function hasAdminToken(): boolean {
  const token = getAdminToken();
  return typeof token === 'string' && token.trim().length > 0;
}

/**
 * True only if a non-expired access token is stored.
 * Expired tokens are cleared so login/RequireAuth do not bounce into a 403 loop.
 */
export function hasUsableAdminToken(): boolean {
  const token = getAdminToken();
  if (typeof token !== 'string' || !token.trim()) return false;
  if (isAccessTokenExpired(token)) {
    clearAdminToken();
    return false;
  }
  return true;
}

export function setAdminToken(token: string): void {
  const normalized = normalizeAdminToken(token);
  if (!normalized) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, normalized);
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}
