import { useEffect, useState } from 'react';
import { useContentBundle } from '@/app/ContentProvider';
import { isUsableBrandingLogoUrl } from '@/lib/contentBundle';
import { clearBrandingCache } from '@/lib/brandingCache';
import { config } from '@/lib/config';

type PartnerBrandMarkProps = {
  /** layout = header bar; auth = centered card */
  variant?: 'layout' | 'auth';
};

/**
 * Same CMS branding logo as public Header (`content.branding.logoUrl`).
 * No link to public site — mark only.
 */
export function PartnerBrandMark({ variant = 'layout' }: PartnerBrandMarkProps) {
  const { content, ready } = useContentBundle();
  const logoSrc = content.branding.logoUrl?.trim() ?? '';
  const showLogo = isUsableBrandingLogoUrl(logoSrc);
  const siteName = content.settings.site_name?.trim() || config.siteName;
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoSrc]);

  const imgClass =
    variant === 'auth'
      ? 'mx-auto h-11 w-auto max-w-[14rem] object-contain sm:h-12'
      : 'h-10 w-auto max-w-[14rem] object-contain sm:h-11';

  let mark;
  if (showLogo && !logoFailed) {
    mark = (
      <img
        src={logoSrc}
        alt={siteName}
        className={imgClass}
        decoding="async"
        fetchPriority="high"
        onError={() => {
          clearBrandingCache();
          setLogoFailed(true);
        }}
      />
    );
  } else if (!ready && !logoFailed) {
    mark = (
      <span
        className={
          variant === 'auth'
            ? 'mx-auto inline-block h-11 w-[8.5rem] animate-pulse rounded-md bg-slate-200/80 sm:h-12 sm:w-[9.5rem]'
            : 'inline-block h-10 w-[8.5rem] animate-pulse rounded-md bg-slate-200/80 sm:h-11 sm:w-[9.5rem]'
        }
        aria-hidden
      />
    );
  } else {
    mark = (
      <span
        className={
          variant === 'auth'
            ? 'text-lg font-bold tracking-tight text-[#1e2a3a]'
            : 'text-[15px] font-semibold tracking-tight text-[#0f5c56] sm:text-lg'
        }
      >
        {siteName}
      </span>
    );
  }

  return mark;
}
