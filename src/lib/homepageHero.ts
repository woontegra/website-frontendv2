/** CMS config → hero slayt listesi (ham URL / asset key). */
export type HeroSlideInput = {
  url: string;
  mobileUrl?: string;
  alt?: string;
  link?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type HeroSlideResolved = {
  src: string;
  mobileSrc: string;
  alt: string;
  link?: string;
};

export const DEFAULT_CAROUSEL_INTERVAL_MS = 5500;
export const MIN_CAROUSEL_INTERVAL_MS = 2000;
export const MAX_CAROUSEL_INTERVAL_MS = 30000;

export const DEFAULT_HERO_DESKTOP_HEIGHT_PX = 650;
export const MIN_HERO_DESKTOP_HEIGHT_PX = 400;
export const MAX_HERO_DESKTOP_HEIGHT_PX = 1000;

export const DEFAULT_HERO_MOBILE_HEIGHT_PX = 520;
export const MIN_HERO_MOBILE_HEIGHT_PX = 350;
export const MAX_HERO_MOBILE_HEIGHT_PX = 800;

/** Masaüstü hero görseli tasarım genişliği — yükseklik ayarı bu genişlikte yorumlanır. */
export const HERO_DESKTOP_DESIGN_WIDTH_PX = 1920;
/** Mobil hero görseli tasarım genişliği — yükseklik ayarı bu genişlikte yorumlanır. */
export const HERO_MOBILE_DESIGN_WIDTH_PX = 1080;

export const HERO_DESKTOP_RECOMMENDED_RATIO = HERO_DESKTOP_DESIGN_WIDTH_PX / 720;
export const HERO_MOBILE_RECOMMENDED_RATIO = HERO_MOBILE_DESIGN_WIDTH_PX / 1350;

/** Admin yüksekliğini tasarım genişliğine göre en-boy oranına çevirir (width / height). */
export function heroViewportAspectRatio(designWidthPx: number, heightPx: number): number {
  const width = Number.isFinite(designWidthPx) && designWidthPx > 0 ? designWidthPx : HERO_DESKTOP_DESIGN_WIDTH_PX;
  const height = Number.isFinite(heightPx) && heightPx > 0 ? heightPx : DEFAULT_HERO_DESKTOP_HEIGHT_PX;
  return width / height;
}

export type HeroImageFit = 'cover' | 'contain';

export type HeroCarouselLayout = {
  desktopHeightPx: number;
  mobileHeightPx: number;
  imageFit: HeroImageFit;
};

/** Seed / placeholder — dosya yok, carousel'de atlanır */
export function isStaleHeroPlaceholderPath(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  return (
    u === '/images/hero-dashboard.png' ||
    u === 'images/hero-dashboard.png' ||
    u.endsWith('/hero-dashboard.png') ||
    u === '/dashboard-screenshot.png' ||
    u.endsWith('/dashboard-screenshot.png')
  );
}

function parseSlideObject(item: Record<string, unknown>): HeroSlideInput | null {
  const url =
    (typeof item.url === 'string' && item.url.trim()) ||
    (typeof item.src === 'string' && item.src.trim()) ||
    '';
  if (!url || isStaleHeroPlaceholderPath(url)) return null;

  const alt = typeof item.alt === 'string' ? item.alt.trim() : '';
  const mobileUrl =
    (typeof item.mobileUrl === 'string' && item.mobileUrl.trim()) ||
    (typeof item.mobileImage === 'string' && item.mobileImage.trim()) ||
    '';
  const link = typeof item.link === 'string' ? item.link.trim() : '';
  const isActive = item.isActive === false ? false : true;
  const sortOrderRaw = item.sortOrder;
  const sortOrder =
    typeof sortOrderRaw === 'number' && Number.isFinite(sortOrderRaw)
      ? Math.round(sortOrderRaw)
      : undefined;

  return {
    url,
    ...(mobileUrl ? { mobileUrl } : {}),
    ...(alt ? { alt } : {}),
    ...(link ? { link } : {}),
    isActive,
    ...(sortOrder !== undefined ? { sortOrder } : {}),
  };
}

function sortHeroSlideInputs(slides: HeroSlideInput[]): HeroSlideInput[] {
  const hasOrder = slides.some((slide) => typeof slide.sortOrder === 'number');
  if (!hasOrder) return slides;
  return [...slides].sort((a, b) => {
    const left = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const right = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export function parseHeroSlidesFromConfig(
  cfg: Record<string, unknown> | null | undefined,
  { includeInactive = true }: { includeInactive?: boolean } = {},
): HeroSlideInput[] {
  if (!cfg) return [];

  const images = cfg.heroImages;
  if (Array.isArray(images)) {
    const slides: HeroSlideInput[] = [];
    for (const item of images) {
      if (typeof item === 'string' && item.trim()) {
        const url = item.trim();
        if (!isStaleHeroPlaceholderPath(url)) {
          slides.push({ url, isActive: true });
        }
        continue;
      }
      if (item && typeof item === 'object') {
        const parsed = parseSlideObject(item as Record<string, unknown>);
        if (parsed) slides.push(parsed);
      }
    }
    const sorted = sortHeroSlideInputs(slides);
    if (sorted.length > 0) {
      return includeInactive ? sorted : sorted.filter((slide) => slide.isActive !== false);
    }
  }

  const single =
    (typeof cfg.heroImage === 'string' && cfg.heroImage.trim()) ||
    (typeof cfg.image === 'string' && cfg.image.trim()) ||
    '';
  if (single && !isStaleHeroPlaceholderPath(single)) {
    return [{ url: single, isActive: true }];
  }
  return [];
}

export function parseCarouselIntervalMs(
  cfg: Record<string, unknown> | null | undefined,
): number {
  const raw = cfg?.carouselIntervalMs ?? cfg?.carouselInterval;
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) return DEFAULT_CAROUSEL_INTERVAL_MS;
  return Math.min(
    MAX_CAROUSEL_INTERVAL_MS,
    Math.max(MIN_CAROUSEL_INTERVAL_MS, Math.round(value)),
  );
}

function clampHeroHeight(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parseHeroDesktopHeightPx(cfg: Record<string, unknown> | null | undefined): number {
  return clampHeroHeight(
    cfg?.heroDesktopHeightPx ?? cfg?.desktopHeightPx,
    DEFAULT_HERO_DESKTOP_HEIGHT_PX,
    MIN_HERO_DESKTOP_HEIGHT_PX,
    MAX_HERO_DESKTOP_HEIGHT_PX,
  );
}

export function parseHeroMobileHeightPx(cfg: Record<string, unknown> | null | undefined): number {
  return clampHeroHeight(
    cfg?.heroMobileHeightPx ?? cfg?.mobileHeightPx,
    DEFAULT_HERO_MOBILE_HEIGHT_PX,
    MIN_HERO_MOBILE_HEIGHT_PX,
    MAX_HERO_MOBILE_HEIGHT_PX,
  );
}

export function parseHeroImageFit(cfg: Record<string, unknown> | null | undefined): HeroImageFit {
  const raw = cfg?.heroImageFit ?? cfg?.imageFit;
  if (raw === 'contain') return 'contain';
  return 'cover';
}

export function parseHeroCarouselLayout(
  cfg: Record<string, unknown> | null | undefined,
): HeroCarouselLayout {
  return {
    desktopHeightPx: parseHeroDesktopHeightPx(cfg),
    mobileHeightPx: parseHeroMobileHeightPx(cfg),
    imageFit: parseHeroImageFit(cfg),
  };
}

/** Önerilen en-boy oranından belirgin sapmada kırpılma uyarısı */
export function isHeroAspectRatioMismatch(
  width: number,
  height: number,
  recommendedRatio: number,
  tolerance = 0.12,
): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  const ratio = width / height;
  return Math.abs(ratio - recommendedRatio) / recommendedRatio > tolerance;
}

export function heroImageAltFromConfig(
  cfg: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  const alt =
    (typeof cfg?.heroImageAlt === 'string' && cfg.heroImageAlt.trim()) ||
    (typeof cfg?.imageAlt === 'string' && cfg.imageAlt.trim()) ||
    '';
  return alt || fallback;
}

export function buildHeroConfigPayload(
  slides: HeroSlideInput[],
  heroImageAlt: string,
  fallbackImage: string,
  fallbackAlt: string,
  options: {
    carouselIntervalMs?: number;
    desktopHeightPx?: number;
    mobileHeightPx?: number;
    imageFit?: HeroImageFit;
  } = {},
): Record<string, unknown> {
  const carouselIntervalMs = parseCarouselIntervalMs({
    carouselIntervalMs: options.carouselIntervalMs,
  });
  const layout = parseHeroCarouselLayout({
    heroDesktopHeightPx: options.desktopHeightPx,
    heroMobileHeightPx: options.mobileHeightPx,
    heroImageFit: options.imageFit,
  });
  const cleaned = sortHeroSlideInputs(
    slides
      .map((slide, index) => ({
        url: slide.url.trim(),
        mobileUrl: slide.mobileUrl?.trim() ?? '',
        alt: slide.alt?.trim() ?? '',
        link: slide.link?.trim() ?? '',
        isActive: slide.isActive !== false,
        sortOrder:
          typeof slide.sortOrder === 'number' && Number.isFinite(slide.sortOrder)
            ? Math.round(slide.sortOrder)
            : index,
      }))
      .filter((slide) => slide.url.length > 0 && !isStaleHeroPlaceholderPath(slide.url)),
  );

  const firstActive = cleaned.find((slide) => slide.isActive)?.url || cleaned[0]?.url || fallbackImage;

  return {
    heroImages: cleaned.map((slide) => ({
      url: slide.url,
      ...(slide.mobileUrl ? { mobileUrl: slide.mobileUrl } : {}),
      ...(slide.alt ? { alt: slide.alt } : {}),
      ...(slide.link ? { link: slide.link } : {}),
      isActive: slide.isActive,
      sortOrder: slide.sortOrder,
    })),
    heroImage: firstActive,
    heroImageAlt: heroImageAlt.trim() || fallbackAlt,
    carouselIntervalMs,
    heroDesktopHeightPx: layout.desktopHeightPx,
    heroMobileHeightPx: layout.mobileHeightPx,
    heroImageFit: layout.imageFit,
  };
}

/** Başlangıç hero görselleri — mevcut statik marketing slaytları */
export const DEFAULT_HERO_SEED_SLIDES: HeroSlideInput[] = [
  {
    url: '/images/hero-bos-form.png',
    alt: 'Bilirkişi hesaplama — boş form ekranı',
    isActive: true,
    sortOrder: 0,
  },
  {
    url: '/images/hero-doldurulmus-form.png',
    alt: 'Bilirkişi hesaplama — yönetim paneli',
    isActive: true,
    sortOrder: 1,
  },
  {
    url: '/images/hero-onizleme-rapor.png',
    alt: 'Bilirkişi hesaplama — hesaplama ve rapor ekranı',
    isActive: true,
    sortOrder: 2,
  },
];
