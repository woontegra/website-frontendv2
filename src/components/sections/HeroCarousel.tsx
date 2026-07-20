import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroCarouselLayout, HeroSlideResolved } from '@/lib/homepageHero';
import {
  DEFAULT_CAROUSEL_INTERVAL_MS,
  DEFAULT_HERO_DESKTOP_HEIGHT_PX,
  DEFAULT_HERO_MOBILE_HEIGHT_PX,
} from '@/lib/homepageHero';

type HeroCarouselProps = {
  slides: HeroSlideResolved[];
  intervalMs?: number;
  layout?: HeroCarouselLayout;
};

function SlideImage({
  slide,
  onError,
  priority,
}: {
  slide: HeroSlideResolved;
  onError: () => void;
  priority?: boolean;
}) {
  const hasMobile = Boolean(slide.mobileSrc?.trim());
  // Genişliğe göre ölçeklenir; object-cover kullanılmaz → sağ/sol kırpılmaz.
  // Mobil görsel yoksa masaüstü kullanılmaz (ölçüler farklı); mobilde slayt gizlenir.
  const image = (
    <picture className={`block w-full max-w-full ${hasMobile ? '' : 'hidden lg:block'}`}>
      <source media="(min-width: 1024px)" srcSet={slide.src} />
      <img
        key={`${slide.src}-${slide.mobileSrc}`}
        src={hasMobile ? slide.mobileSrc : slide.src}
        alt={slide.alt}
        className="block h-auto w-full max-w-full"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={onError}
      />
    </picture>
  );

  const link = slide.link?.trim();
  if (link) {
    const external = /^https?:\/\//i.test(link);
    return (
      <a
        href={link}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block w-full max-w-full"
        aria-label={slide.alt}
        tabIndex={priority ? undefined : -1}
      >
        {image}
      </a>
    );
  }

  return <div className="block w-full max-w-full">{image}</div>;
}

export function HeroCarousel({
  slides,
  intervalMs = DEFAULT_CAROUSEL_INTERVAL_MS,
  layout,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const count = slides.length;
  const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 2000 ? intervalMs : DEFAULT_CAROUSEL_INTERVAL_MS;
  const desktopHeightPx = layout?.desktopHeightPx ?? DEFAULT_HERO_DESKTOP_HEIGHT_PX;
  const mobileHeightPx = layout?.mobileHeightPx ?? DEFAULT_HERO_MOBILE_HEIGHT_PX;

  const goTo = useCallback(
    (next: number, dir?: 1 | -1) => {
      if (count <= 1) return;
      const normalized = ((next % count) + count) % count;
      setDirection(dir ?? (normalized > index || (index === count - 1 && normalized === 0) ? 1 : -1));
      setIndex(normalized);
    },
    [count, index],
  );

  useEffect(() => {
    setIndex((i) => (count > 0 && i >= count ? 0 : i));
  }, [count]);

  useEffect(() => {
    setFailedSrc(null);
  }, [slides]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, safeInterval);
    return () => window.clearInterval(timer);
  }, [count, safeInterval, index]);

  if (count === 0) return null;

  const current = slides[index] ?? slides[0];
  const showFailed = failedSrc === current.src;

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      <div
        className="hero-carousel-viewport relative w-full max-w-full overflow-hidden"
        style={{
          ['--hero-h-mobile' as string]: `${mobileHeightPx}px`,
          ['--hero-h-desktop' as string]: `${desktopHeightPx}px`,
          ['--hero-dir' as string]: String(direction),
        }}
      >
        {!showFailed ? (
          <div className="hero-carousel-stage" aria-live="polite">
            {slides.map((slide, i) => {
              const active = i === index;
              return (
                <div
                  key={`slide-${i}-${slide.src}`}
                  className={`hero-carousel-slide${active ? ' is-active' : ''}`}
                  aria-hidden={!active}
                >
                  <SlideImage
                    slide={slide}
                    priority={active}
                    onError={() => {
                      if (active) setFailedSrc(slide.src);
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[200px] w-full items-center justify-center bg-slate-200 px-4 text-center text-sm text-slate-500">
            Görsel yüklenemedi
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1, -1)}
              className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:h-10 sm:w-10"
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1, 1)}
              className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:h-10 sm:w-10"
              aria-label="Sonraki görsel"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              className="absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 sm:bottom-4"
              role="tablist"
              aria-label="Hero görselleri"
            >
              {slides.map((slide, i) => (
                <button
                  key={`dot-${i}-${slide.src}`}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Görsel ${i + 1}`}
                  onClick={() => goTo(i, i >= index ? 1 : -1)}
                  className={`h-2 shrink-0 rounded-full transition-all duration-500 ${
                    i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <span className="sr-only">{current.alt}</span>
    </div>
  );
}
