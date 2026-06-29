import { useCallback, useEffect, useState } from 'react';
import { Check, Gift, X, ZoomIn } from 'lucide-react';
import {
  ANNUAL_GIFT_SECTION_DESCRIPTION,
  ANNUAL_GIFT_SECTION_FEATURES,
  ANNUAL_GIFT_SECTION_FOOTNOTE,
  ANNUAL_GIFT_SECTION_INTRO,
  ANNUAL_GIFT_SECTION_SUBTITLE,
  ANNUAL_GIFT_SECTION_TITLE,
  MUVEKKIL_KASA_GIFT_PROMO_IMAGE,
} from '@/lib/annualGiftPromo';

/** Tam genişlikte yıllık hediye kampanya bölümü — ödeme kartının dışında, özellik kartlarının üstünde */
export function AnnualGiftPromoSection() {
  const [imageSrc, setImageSrc] = useState(MUVEKKIL_KASA_GIFT_PROMO_IMAGE.src);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox]);

  return (
    <>
      <section
        className="mt-10 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 shadow-lg ring-1 ring-emerald-500/10 lg:mt-12"
        aria-labelledby="annual-gift-promo-title"
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-10 lg:p-10">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
              <Gift className="h-3.5 w-3.5" aria-hidden />
              Yıllık paket kampanyası
            </div>

            <h2
              id="annual-gift-promo-title"
              className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              {ANNUAL_GIFT_SECTION_TITLE}
            </h2>
            <p className="mt-2 text-base font-semibold text-emerald-800 sm:text-lg">
              {ANNUAL_GIFT_SECTION_SUBTITLE}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              {ANNUAL_GIFT_SECTION_INTRO}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {ANNUAL_GIFT_SECTION_DESCRIPTION}
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-1">
              {ANNUAL_GIFT_SECTION_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {ANNUAL_GIFT_SECTION_FOOTNOTE}
            </p>
          </div>

          <div className="flex w-full items-center justify-center lg:justify-end">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="group relative w-full max-w-xl cursor-zoom-in overflow-hidden rounded-xl border border-emerald-100/80 bg-white p-2 text-left shadow-xl ring-1 ring-emerald-500/15 transition hover:ring-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={`${MUVEKKIL_KASA_GIFT_PROMO_IMAGE.alt} — büyütmek için tıklayın`}
            >
              <img
                src={imageSrc}
                alt={MUVEKKIL_KASA_GIFT_PROMO_IMAGE.alt}
                className="w-full rounded-lg object-contain object-center"
                loading="lazy"
                decoding="async"
                onError={() => {
                  if (imageSrc !== MUVEKKIL_KASA_GIFT_PROMO_IMAGE.fallbackSrc) {
                    setImageSrc(MUVEKKIL_KASA_GIFT_PROMO_IMAGE.fallbackSrc);
                  }
                }}
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                Büyüt
              </span>
            </button>
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={MUVEKKIL_KASA_GIFT_PROMO_IMAGE.alt}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={imageSrc}
            alt={MUVEKKIL_KASA_GIFT_PROMO_IMAGE.alt}
            className="max-h-[90vh] max-w-[min(1200px,95vw)] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
