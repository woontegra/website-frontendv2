/** CMS config → hero slayt listesi (ham URL / asset key). */
export type HeroSlideInput = {
  url: string;
  alt?: string;
};

export type HeroSlideResolved = {
  src: string;
  alt: string;
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

export function parseHeroSlidesFromConfig(
  cfg: Record<string, unknown> | null | undefined,
): HeroSlideInput[] {
  if (!cfg) return [];

  const images = cfg.heroImages;
  if (Array.isArray(images)) {
    const slides: HeroSlideInput[] = [];
    for (const item of images) {
      if (typeof item === 'string' && item.trim()) {
        const url = item.trim();
        if (!isStaleHeroPlaceholderPath(url)) slides.push({ url });
        continue;
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const url =
          (typeof o.url === 'string' && o.url.trim()) ||
          (typeof o.src === 'string' && o.src.trim()) ||
          '';
        if (url && !isStaleHeroPlaceholderPath(url)) {
          slides.push({
            url,
            alt: typeof o.alt === 'string' ? o.alt : undefined,
          });
        }
      }
    }
    if (slides.length > 0) return slides;
  }

  const single =
    (typeof cfg.heroImage === 'string' && cfg.heroImage.trim()) ||
    (typeof cfg.image === 'string' && cfg.image.trim()) ||
    '';
  if (single && !isStaleHeroPlaceholderPath(single)) return [{ url: single }];
  return [];
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
): Record<string, unknown> {
  const cleaned = slides
    .map((s) => ({
      url: s.url.trim(),
      alt: s.alt?.trim() ?? '',
    }))
    .filter((s) => s.url.length > 0 && !isStaleHeroPlaceholderPath(s.url));

  const first = cleaned[0]?.url || fallbackImage;
  return {
    heroImages: cleaned.map((s) => ({
      url: s.url,
      ...(s.alt ? { alt: s.alt } : {}),
    })),
    heroImage: first,
    heroImageAlt: heroImageAlt.trim() || fallbackAlt,
  };
}
