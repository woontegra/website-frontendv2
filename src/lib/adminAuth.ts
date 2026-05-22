import { normalizeAdminToken } from './adminTokenDebug';

/** Mevcut website-frontend admin paneli ile aynı anahtar */
const ADMIN_TOKEN_KEY = 'token';

export { normalizeAdminToken };

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

export function setAdminToken(token: string): void {
  const normalized = normalizeAdminToken(token);
  if (!normalized) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, normalized);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
