import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Public site: her pathname değişiminde sayfayı en üste alır. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
