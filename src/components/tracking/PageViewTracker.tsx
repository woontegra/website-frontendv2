import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/trackPageView';

/** Public site route değişimlerinde page_views kaydı */
export function PageViewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
    trackPageView(pathname, referrer);
  }, [pathname]);

  return null;
}
