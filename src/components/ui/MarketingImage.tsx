type MarketingImageProps = {
  src: string;
  alt: string;
  className?: string;
  frame?: 'light' | 'dark';
};

export function MarketingImage({
  src,
  alt,
  className = '',
  frame = 'light',
}: MarketingImageProps) {
  const frameClass =
    frame === 'dark'
      ? 'rounded-xl border border-slate-600 bg-slate-900 object-cover'
      : 'rounded-xl border-2 border-slate-200 bg-white object-cover shadow-md';

  return (
    <img
      src={src}
      alt={alt}
      className={`${frameClass} ${className}`}
      loading="lazy"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = target.nextElementSibling;
        if (fallback instanceof HTMLElement) {
          fallback.style.display = 'flex';
        }
      }}
    />
  );
}

type MarketingImageFallbackProps = {
  label: string;
  variant?: 'light' | 'dark';
};

export function MarketingImageFallback({
  label,
  variant = 'light',
}: MarketingImageFallbackProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`hidden h-full min-h-[260px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center lg:min-h-[340px] ${
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
      <p className="max-w-xs text-xs text-slate-400">
        Görsel: public/images/{label}
      </p>
    </div>
  );
}
