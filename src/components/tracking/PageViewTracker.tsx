import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hasAnalyticsConsent } from '@/lib/cookieConsent';
import { trackPageView } from '@/lib/trackPageView';

/** Public site route değişimlerinde page_views kaydı — yalnızca analitik onayı ile */
export function PageViewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const sendIfAllowed = () => {
      if (!hasAnalyticsConsent()) return;
      const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
      trackPageView(pathname, referrer);
    };

    sendIfAllowed();

    const onConsentChange = () => sendIfAllowed();
    window.addEventListener('cookieConsentChanged', onConsentChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') sendIfAllowed();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('cookieConsentChanged', onConsentChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [pathname]);

  return null;
}
