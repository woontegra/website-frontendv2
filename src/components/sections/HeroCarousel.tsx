import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlideResolved } from '@/lib/homepageHero';

type HeroCarouselProps = {
  slides: HeroSlideResolved[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
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
      setIndex((i) => (i + 1) % count);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const current = slides[index] ?? slides[0];
  const showFailed = failedSrc === current.src;

  return (
    <div className="relative w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-slate-600/90 bg-slate-950 shadow-2xl ring-1 ring-emerald-500/20
          aspect-[16/10] min-h-[200px]
          sm:min-h-[260px]
          lg:min-h-[360px]
          xl:min-h-[420px]
          2xl:min-h-[480px]"
      >
        <div className="absolute inset-0">
          {!showFailed ? (
            <img
              key={current.src}
              src={current.src}
              alt={current.alt}
              className="block h-full w-full object-contain object-center"
              loading="eager"
              decoding="async"
              onError={() => {
                if (import.meta.env.DEV) {
                  console.warn('[HeroCarousel] Görsel yüklenemedi:', current.src);
                }
                setFailedSrc(current.src);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 px-4 text-center text-sm text-slate-400">
              Görsel yüklenemedi
            </div>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-900/90 text-white transition hover:bg-slate-800"
            aria-label="Önceki görsel"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Hero görselleri">
            {slides.map((slide, i) => (
              <button
                key={`dot-${i}-${slide.src}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Görsel ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-7 bg-emerald-400' : 'w-2 bg-slate-500 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          <span className="min-w-[2.5rem] text-center text-xs font-medium text-slate-400" aria-live="polite">
            {index + 1}/{count}
          </span>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-900/90 text-white transition hover:bg-slate-800"
            aria-label="Sonraki görsel"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <span className="sr-only">{current.alt}</span>
    </div>
  );
}
