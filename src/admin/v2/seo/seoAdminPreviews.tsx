import { useState } from 'react';
import { AlertCircle, ImageIcon } from 'lucide-react';
import type { SeoDraftWarning, SeoQuality } from '@/admin/v2/seo/seoAdminHelpers';
import { googleDisplayUrl, truncate } from '@/admin/v2/seo/seoAdminHelpers';

const qualityClass: Record<SeoQuality, string> = {
  ok: 'text-emerald-700',
  warn: 'text-amber-700',
  error: 'text-red-700',
};

const warnToneClass: Record<SeoDraftWarning['tone'], string> = {
  warn: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  error: 'bg-red-50 text-red-900 ring-red-200/80',
  danger: 'bg-orange-50 text-orange-900 ring-orange-200/90',
};

export function CharCounter({
  value,
  idealMin,
  idealMax,
  required: isRequired,
}: {
  label?: string;
  value: string;
  idealMin: number;
  idealMax: number;
  required?: boolean;
}) {
  const len = value.length;
  const q =
    len === 0 && isRequired
      ? 'error'
      : len === 0
        ? 'warn'
        : len < idealMin - 10 || len > idealMax + 20
          ? 'warn'
          : len < idealMin || len > idealMax
            ? 'warn'
            : 'ok';

  return (
    <p className={`mt-0.5 text-[10px] ${qualityClass[q]}`}>
      {len} karakter · ideal {idealMin}–{idealMax}
      {len === 0 && isRequired ? ' · boş' : ''}
      {len > 0 && len < idealMin - 10 ? ' · kısa' : ''}
      {len > idealMax + 20 ? ' · uzun' : ''}
    </p>
  );
}

export function SeoQualityAlerts({ warnings }: { warnings: SeoDraftWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-md border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2 text-[11px] text-emerald-800">
        SEO kontrolleri tamam görünüyor.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {warnings.map((w) => (
        <span
          key={w.id}
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${warnToneClass[w.tone]}`}
        >
          {w.label}
        </span>
      ))}
    </div>
  );
}

export function GoogleSearchPreview({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}) {
  const displayTitle = title.trim() || 'Sayfa başlığı';
  const hasDesc = Boolean(description.trim());
  const displayDesc = hasDesc
    ? truncate(description.trim(), 155)
    : 'Meta açıklama tanımlanmadı.';
  const url = googleDisplayUrl(path);

  return (
    <div className="rounded-md border border-[#e8eef2] bg-[#fafbfc] p-2.5">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#8a9aaa]">
        Google önizleme
      </p>
      <p className="truncate text-[11px] text-[#006621]">{url}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] font-normal leading-snug text-[#1a0dab]">
        {truncate(displayTitle, 58)}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#4d5156]">{displayDesc}</p>
      {!hasDesc && (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-800">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Meta açıklama ekleyin.
        </p>
      )}
    </div>
  );
}

export function SocialSharePreview({
  ogTitle,
  ogDescription,
  ogImage,
  path,
}: {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  path: string;
}) {
  const title = ogTitle.trim() || 'Sosyal başlık';
  const desc = ogDescription.trim() || 'Sosyal açıklama yok';
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(ogImage.trim()) && !imgFailed;

  const resolveSrc = (url: string) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    if (url.startsWith('/') && typeof window !== 'undefined') {
      return `${window.location.origin}${url}`;
    }
    return url;
  };

  return (
    <div className="rounded-md border border-[#e8eef2] bg-white p-2.5">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#8a9aaa]">
        Sosyal önizleme
      </p>
      <div className="overflow-hidden rounded border border-[#dbe4ea]">
        {hasImage ? (
          <img
            src={resolveSrc(ogImage.trim())}
            alt=""
            className="h-16 w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-14 items-center justify-center gap-1.5 bg-[#f4f7f6] text-[10px] text-[#8a9aaa]">
            <ImageIcon className="h-4 w-4" />
            Görsel yok
          </div>
        )}
        <div className="border-t border-[#eef2f5] bg-[#f7faf9] px-2 py-1.5">
          <p className="truncate text-[9px] text-[#8a9aaa]">{googleDisplayUrl(path)}</p>
          <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-[#1e2a3a]">
            {truncate(title, 55)}
          </p>
          <p className="line-clamp-2 text-[10px] leading-snug text-[#5c6b7a]">{truncate(desc, 90)}</p>
        </div>
      </div>
    </div>
  );
}
