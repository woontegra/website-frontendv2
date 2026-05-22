import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSatinAlStaticFallback } from '@/lib/marketingProductImages';

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [srcByIndex, setSrcByIndex] = useState<Record<number, string>>(() =>
    Object.fromEntries(slides.map((src, i) => [i, src])),
  );

  useEffect(() => {
    setSrcByIndex(Object.fromEntries(slides.map((src, i) => [i, src])));
    setIndex((i) => (i >= slides.length ? 0 : i));
  }, [slides.join('|')]);

  if (slides.length === 0) return null;

  const total = slides.length;
  const go = (n: number) => setIndex(((n % total) + total) % total);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        {slides.map((src, i) => (
          <img
            key={`${i}-${srcByIndex[i] ?? src}`}
            src={srcByIndex[i] ?? src}
            alt={total > 1 ? `${alt} — ${i + 1}/${total}` : alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            onError={() => {
              const fallback = getSatinAlStaticFallback(i);
              setSrcByIndex((prev) =>
                prev[i] === fallback ? prev : { ...prev, [i]: fallback },
              );
            }}
          />
        ))}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-md hover:bg-white"
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="h-5 w-5 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
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
  );
}
