export const COOKIE_CONSENT_KEY = 'cookieConsent';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';

export type CookieConsentPreferences = {
  categories: CookieCategory[];
  timestamp: string;
};

export function readCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw?.trim() || raw === 'null') return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (!parsed?.categories || !Array.isArray(parsed.categories)) return null;
    return parsed;
  } catch {
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

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}
