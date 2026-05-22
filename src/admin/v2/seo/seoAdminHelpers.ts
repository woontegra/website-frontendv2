export type SeoQuality = 'ok' | 'warn' | 'error';

export function seoCharQuality(
  length: number,
  idealMin: number,
  idealMax: number,
): SeoQuality {
  if (length === 0) return 'error';
  if (length < idealMin - 10) return 'warn';
  if (length > idealMax + 20) return 'warn';
  if (length < idealMin || length > idealMax) return 'warn';
  return 'ok';
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function displayPageName(path: string, pageKey: string | null, title: string | null): string {
  if (title?.trim()) return title.trim();
  if (pageKey?.trim()) return pageKey.trim();
  return path || 'Sayfa';
}

export function googleDisplayUrl(path: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.bilirkisihesap.com';
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  try {
    const u = new URL(origin);
    return `${u.host}${normalized}`;
  } catch {
    return `${origin}${normalized}`;
  }
}

export type SeoStats = {
  total: number;
  missingDescription: number;
  missingOgImage: number;
  noIndexCount: number;
};

export type SeoRowLike = {
  description: string | null;
  ogImage: string | null;
  noIndex: boolean;
};

export function computeSeoStats(rows: SeoRowLike[]): SeoStats {
  return {
    total: rows.length,
    missingDescription: rows.filter((r) => !r.description?.trim()).length,
    missingOgImage: rows.filter((r) => !r.ogImage?.trim()).length,
    noIndexCount: rows.filter((r) => r.noIndex).length,
  };
}

export type SeoRowStatusInput = SeoRowLike & {
  title?: string | null;
  noIndex?: boolean;
  isActive?: boolean;
};

export function seoWarningSummary(row: SeoRowStatusInput): string {
  const issues: string[] = [];
  if (!row.title?.trim()) issues.push('Başlık eksik');
  if (!row.description?.trim()) issues.push('Açıklama eksik');
  if (!row.ogImage?.trim()) issues.push('OG görsel eksik');
  if (row.noIndex) issues.push('noIndex');
  else if (row.isActive === false) issues.push('Pasif');
  return issues.length === 0 ? 'Tamam' : issues.join(' · ');
}

export function seoHasIssues(row: SeoRowStatusInput): boolean {
  return seoWarningSummary(row) !== 'Tamam';
}

/** Bilinen tanıtım sayfaları — sol panel sırası */
export const SEO_KNOWN_PATH_ORDER = [
  '/',
  '/fiyatlandirma',
  '/demo-talep',
  '/iletisim',
  '/sss',
  '/satin-al',
] as const;

const SEO_PATH_LABELS: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/fiyatlandirma': 'Fiyatlandırma',
  '/demo-talep': 'Demo Talep',
  '/iletisim': 'İletişim',
  '/sss': 'SSS',
  '/satin-al': 'Satın Al',
};

export function seoPageLabel(path: string, pageKey?: string | null): string {
  if (SEO_PATH_LABELS[path]) return SEO_PATH_LABELS[path];
  if (pageKey?.trim()) return pageKey.trim();
  return path || 'Sayfa';
}

export function sortSeoRowsByKnownPaths<T extends { path: string }>(rows: T[]): T[] {
  const order = new Map<string, number>(
    SEO_KNOWN_PATH_ORDER.map((p, i) => [p, i]),
  );
  return [...rows].sort((a, b) => {
    const ai = order.has(a.path) ? order.get(a.path)! : 999;
    const bi = order.has(b.path) ? order.get(b.path)! : 999;
    if (ai !== bi) return ai - bi;
    return a.path.localeCompare(b.path);
  });
}

/** V2 PATCH keywords desteklemiyor */
export const SEO_KEYWORDS_PATCH_SUPPORTED = false;

export type SeoDraftWarning = {
  id: string;
  label: string;
  tone: 'warn' | 'error' | 'danger';
};

export function computeSeoDraftWarnings(draft: {
  title: string;
  description: string;
  ogImage: string;
  noIndex: boolean;
}): SeoDraftWarning[] {
  const warnings: SeoDraftWarning[] = [];
  const titleLen = draft.title.trim().length;
  const descLen = draft.description.trim().length;

  if (!titleLen) warnings.push({ id: 'title-empty', label: 'Başlık boş', tone: 'error' });
  else if (titleLen < 40) warnings.push({ id: 'title-short', label: 'Başlık kısa', tone: 'warn' });
  else if (titleLen > 70) warnings.push({ id: 'title-long', label: 'Başlık uzun', tone: 'warn' });

  if (!descLen) {
    warnings.push({ id: 'desc-empty', label: 'Meta açıklama eksik', tone: 'error' });
  } else if (descLen < 120) {
    warnings.push({ id: 'desc-short', label: 'Açıklama kısa', tone: 'warn' });
  } else if (descLen > 170) {
    warnings.push({ id: 'desc-long', label: 'Açıklama uzun', tone: 'warn' });
  }

  if (!draft.ogImage.trim()) {
    warnings.push({ id: 'og-missing', label: 'OG görsel eksik', tone: 'warn' });
  }

  if (draft.noIndex) {
    warnings.push({ id: 'noindex', label: 'noIndex aktif', tone: 'danger' });
  }

  return warnings;
}
