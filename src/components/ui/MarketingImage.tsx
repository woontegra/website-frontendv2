type MarketingImageProps = {
  src: string;
  alt: string;
  className?: string;
  frame?: 'light' | 'dark';
  fit?: 'cover' | 'contain';
  /** true: çerçeve/border img’de değil, dış sarmalayıcıda */
  bare?: boolean;
};

function hideNextFallback(img: HTMLImageElement) {
  const fallback = img.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.style.display = 'none';
  }
}

function showNextFallback(img: HTMLImageElement, label: string) {
  const fallback = img.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.style.display = 'flex';
    const labelEl = fallback.querySelector('[data-fallback-src]');
    if (labelEl instanceof HTMLElement) {
      labelEl.textContent = label.length > 48 ? `${label.slice(0, 48)}…` : label;
    }
  }
}

export function MarketingImage({
  src,
  alt,
  className = '',
  frame = 'light',
  fit = 'cover',
  bare = false,
}: MarketingImageProps) {
  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover';
  const frameClass = bare
    ? objectFit
    : frame === 'dark'
      ? `rounded-xl border border-slate-600 bg-slate-900 ${objectFit}`
      : `rounded-xl border-2 border-slate-200 bg-white ${objectFit} shadow-md`;

  const safeSrc = (src || '').trim();

  return (
    <img
      key={safeSrc}
      src={safeSrc}
      alt={alt}
      className={`block max-w-full ${frameClass} ${className}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        e.currentTarget.style.display = 'block';
        hideNextFallback(e.currentTarget);
      }}
      onError={(e) => {
        if (import.meta.env.DEV) {
          console.warn('[MarketingImage] Yüklenemedi:', safeSrc);
        }
        const target = e.currentTarget;
        target.style.display = 'none';
        showNextFallback(target, safeSrc);
      }}
    />
  );
}

type MarketingImageFallbackProps = {
  label: string;
  variant?: 'light' | 'dark';
  /** false: görsel yüklenene kadar gizli (varsayılan) */
  visible?: boolean;
};

export function MarketingImageFallback({
  label,
  variant = 'light',
  visible = false,
}: MarketingImageFallbackProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`${visible ? 'flex' : 'hidden'} h-full min-h-[260px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center lg:min-h-[340px] ${
        isDark
          ? 'border-slate-500 bg-slate-900 text-slate-300'
          : 'border-slate-300 bg-slate-50 text-slate-600'
      }`}
      aria-hidden
    >
      <div
        className={`h-16 w-24 rounded-lg ${
          isDark ? 'bg-slate-700 ring-1 ring-emerald-500/40' : 'bg-slate-200'
        }`}
      />
      <p className="text-sm font-semibold text-inherit">Panel önizlemesi</p>
      <p className="max-w-xs break-all text-xs text-slate-400" data-fallback-src>
        {label.startsWith('http') ? label : `Görsel: public/images/${label}`}
      </p>
    </div>
  );
}
