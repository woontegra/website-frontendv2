import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hasMarketingConsent } from '@/lib/cookieConsent';
import { fetchPublicTrackingSettings } from '@/lib/publicTracking';
import { injectMetaPixel, revokeMetaPixel, trackMetaPageView } from './metaPixelRuntime';

/** Pazarlama çerezi onayı + public site; admin ve ödeme callback sayfalarında çalışmaz. */
export function PublicMetaPixel() {
  const { pathname } = useLocation();
  const isPublicMarketingSurface =
    !pathname.startsWith('/admin') &&
    pathname !== '/odeme-basarili' &&
    pathname !== '/odeme-basarisiz';

  useEffect(() => {
    if (!isPublicMarketingSurface) return;

    let cancelled = false;

    async function sync() {
      if (!hasMarketingConsent()) {
        revokeMetaPixel();
        return;
      }

      const settings = await fetchPublicTrackingSettings();
      const pixelId = settings.metaPixelId?.trim();
      if (cancelled || !pixelId) return;

      injectMetaPixel(pixelId);
    }

    void sync();

    const onConsentChange = () => void sync();
    window.addEventListener('cookieConsentChanged', onConsentChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') void sync();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('cookieConsentChanged', onConsentChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [isPublicMarketingSurface]);

  useEffect(() => {
    if (!isPublicMarketingSurface || !hasMarketingConsent()) return;
    trackMetaPageView();
  }, [pathname, isPublicMarketingSurface]);

  return null;
}
