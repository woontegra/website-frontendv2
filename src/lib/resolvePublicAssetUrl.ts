import { config } from '@/lib/config';

/** Eski varsayılan — dosya sunucuda yok */
export function isLegacyProductPlaceholder(url: string): boolean {
  const u = (url || '').trim();
  return u === '/dashboard-screenshot.png' || u === 'dashboard-screenshot.png';
}

function normalizeRawImageUrl(url: string): string {
  let u = url.trim();
  if (!u) return '';
  if (u.startsWith('//')) u = `https:${u}`;
  return u;
}

/** API / upload dosyalarının sunulduğu origin (dev: backend :3001) */
export function getBackendAssetOrigin(): string {
  const base = (config.API_BASE_URL || '').trim().replace(/\/$/, '');
  if (base) {
    return base.replace(/\/api\/?$/i, '') || base;
  }
  if (import.meta.env.DEV) return 'http://localhost:3001';
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** imageUrl tek path veya JSON dizi: ["/uploads/a.png","https://…blob.vercel-storage.com/…"] */
export function parseProductImageUrls(imageUrl?: string | null): string[] {
  const raw = (imageUrl || '').trim();
  if (!raw) return [];

  const collect = (items: string[]): string[] =>
    items
      .map((item) => normalizeRawImageUrl(item))
      .filter((item) => item && !isLegacyProductPlaceholder(item));

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return collect(
        parsed.filter((item): item is string => typeof item === 'string'),
      );
    } catch {
      return [];
    }
  }
  if (isLegacyProductPlaceholder(raw)) return [];
  return collect([raw]);
}

export function serializeProductImageUrls(urls: string[]): string {
  const clean = urls.map((u) => u.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

/** Admin önizleme — canlıda /uploads Vercel proxy ile açılır */
export function resolveAdminAssetUrl(url: string): string {
  return resolvePublicAssetUrl(url);
}

/**
 * /uploads/... → backend (prod: Vercel proxy, dev: Vite proxy veya API origin).
 * /hero/... → frontend public klasörü, her ortamda aynı origin.
 */
export function resolvePublicAssetUrl(url: string): string {
  const u = normalizeRawImageUrl(url);
  if (!u) return '';

  if (/^https?:\/\//i.test(u)) {
    return u;
  }

  if (u.startsWith('/hero/') || u.startsWith('/images/')) {
    return /[ ()]/.test(u) ? encodeURI(u) : u;
  }

  if (u.startsWith('/uploads/')) {
    const path = encodeURI(u);
    const origin = getBackendAssetOrigin();
    return origin ? `${origin}${path}` : path;
  }

  if (u.startsWith('/')) {
    const path = /[ ()]/.test(u) ? encodeURI(u) : u;
    const origin = getBackendAssetOrigin();
    if (origin && (import.meta.env.DEV || u.startsWith('/uploads/'))) {
      return `${origin}${path}`;
    }
    return path;
  }

  return u;
}
