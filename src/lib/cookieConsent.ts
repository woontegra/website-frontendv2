export const COOKIE_CONSENT_KEY = 'cookieConsent';

/** 12 ay (365 gün) — tercih kaydı geçerlilik süresi */
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';

export type CookieConsentPreferences = {
  categories: CookieCategory[];
  timestamp: string;
};

function isExpired(timestamp: string): boolean {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return true;
  return Date.now() - t > CONSENT_TTL_MS;
}

export function readCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw?.trim() || raw === 'null') return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (!parsed?.categories || !Array.isArray(parsed.categories)) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    if (!parsed.timestamp || isExpired(parsed.timestamp)) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeCookieConsent(categories: CookieCategory[]): void {
  const prefs: CookieConsentPreferences = {
    categories: [...new Set(categories)],
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event('cookieConsentChanged'));
}

export function hasMarketingConsent(): boolean {
  return readCookieConsent()?.categories.includes('marketing') ?? false;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.categories.includes('analytics') ?? false;
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}
