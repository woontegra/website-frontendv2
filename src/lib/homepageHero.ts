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
  carouselIntervalMs: number = DEFAULT_CAROUSEL_INTERVAL_MS,
): Record<string, unknown> {
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
    carouselIntervalMs: parseCarouselIntervalMs({ carouselIntervalMs }),
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
