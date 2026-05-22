const STORAGE_KEY = 'bh_site_branding_v1';

export type CachedBranding = {
  logoUrl: string;
  faviconUrl?: string;
};

export function readBrandingCache(): CachedBranding | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBranding;
    if (!parsed?.logoUrl?.trim()) return null;
    return {
      logoUrl: parsed.logoUrl.trim(),
      faviconUrl: parsed.faviconUrl?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function clearBrandingCache(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function writeBrandingCache(branding: { logoUrl?: string; faviconUrl?: string }): void {
  if (typeof window === 'undefined') return;
  const logoUrl = branding.logoUrl?.trim();
  if (!logoUrl) return;
  try {
    const payload: CachedBranding = {
      logoUrl,
      ...(branding.faviconUrl?.trim() ? { faviconUrl: branding.faviconUrl.trim() } : {}),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
