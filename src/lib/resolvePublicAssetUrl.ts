/** Eski varsayılan — dosya sunucuda yok */
export function isLegacyProductPlaceholder(url: string): boolean {
  const u = (url || '').trim();
  return u === '/dashboard-screenshot.png' || u === 'dashboard-screenshot.png';
}

/** imageUrl tek path veya JSON dizi: ["/uploads/a.png","/uploads/b.png"] */
export function parseProductImageUrls(imageUrl?: string | null): string[] {
  const raw = (imageUrl || '').trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item && !isLegacyProductPlaceholder(item));
    } catch {
      return [];
    }
  }
  if (isLegacyProductPlaceholder(raw)) return [];
  return [raw];
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
  const u = (url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) {
    try {
      const { hostname, pathname } = new URL(u);
      if ((hostname === 'localhost' || hostname === '127.0.0.1') && pathname.startsWith('/')) {
        return pathname;
      }
    } catch {
      /* ignore */
    }
    return u;
  }
  if (u.startsWith('/hero/')) return u;
  if (u.startsWith('/')) {
    const path = /[ ()]/.test(u) ? encodeURI(u) : u;
    if (import.meta.env.PROD) {
      return path;
    }
    if (u.startsWith('/uploads/')) {
      return path;
    }
    const api = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const origin = api.replace(/\/api\/?$/i, '');
    return `${origin}${path}`;
  }
  return u;
}
