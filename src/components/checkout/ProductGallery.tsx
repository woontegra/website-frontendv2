import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { getSatinAlStaticFallback } from '@/lib/marketingProductImages';

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [srcByIndex, setSrcByIndex] = useState<Record<number, string>>(() =>
    Object.fromEntries(slides.map((src, i) => [i, src])),
  );

  useEffect(() => {
    setSrcByIndex(Object.fromEntries(slides.map((src, i) => [i, src])));
    setIndex((i) => (i >= slides.length ? 0 : i));
  }, [slides.join('|')]);

  const total = slides.length;
  const go = useCallback((n: number) => setIndex(((n % total) + total) % total), [total]);

  const currentSrc = srcByIndex[index] ?? slides[index];

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (total > 1 && e.key === 'ArrowLeft') go(index - 1);
      if (total > 1 && e.key === 'ArrowRight') go(index + 1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen, index, total, go]);

  if (slides.length === 0) return null;

  const imageAlt = total > 1 ? `${alt} — ${index + 1}/${total}` : alt;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 shadow-md">
        <div className="relative aspect-[4/3] w-full">
          <button
            type="button"
            className="group absolute inset-0 z-[1] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            onClick={() => setLightboxOpen(true)}
            aria-label="Görseli büyüt"
          >
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" />
              Büyüt
            </span>
          </button>
          {slides.map((src, i) => (
            <img
              key={`${i}-${srcByIndex[i] ?? src}`}
              src={srcByIndex[i] ?? src}
              alt={total > 1 ? `${alt} — ${i + 1}/${total}` : alt}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className={`pointer-events-none absolute inset-0 size-full object-contain object-center p-1 transition-opacity duration-300 sm:p-2 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => {
                const fallback = getSatinAlStaticFallback(i);
                if (!fallback || (srcByIndex[i] ?? src) === fallback) return;
                setSrcByIndex((prev) => ({ ...prev, [i]: fallback }));
              }}
            />
          ))}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-md hover:bg-white"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="h-5 w-5 text-slate-800" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-md hover:bg-white"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="h-5 w-5 text-slate-800" />
              </button>
            </>
          )}
        </div>
        {total > 1 && (
          <div className="flex justify-center gap-2 border-t border-slate-100 py-3">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Görsel ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && currentSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Ürün görseli — büyük önizleme"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Kapat"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20 sm:left-6"
                aria-label="Önceki görsel"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20 sm:right-6"
                aria-label="Sonraki görsel"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="flex max-h-[90vh] max-w-[min(1200px,95vw)] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentSrc}
              alt={imageAlt}
              className="max-h-[85vh] w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
            {total > 1 && (
              <p className="mt-3 text-sm font-medium text-white/80">
                {index + 1} / {total}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
