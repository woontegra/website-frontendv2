import { useLayoutEffect } from 'react';

const PUBLIC_MARKETING_ORIGIN = 'https://www.bilirkisihesap.com';

function shouldRedirectFromWebapi(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'webapi.bilirkisihesap.com') return true;
  if (h.startsWith('webapi.') && h.endsWith('bilirkisihesap.com')) return true;
  return false;
}

/** PayTR yanlışlıkla webapi köküne yönlendirdiyse aynı path ile www sitesine taşır (CORS / yanlış origin önlemi). */
export function useRedirectPaymentResultFromWebapi(): void {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const { hostname, pathname, search, hash } = window.location;
    if (!pathname.startsWith('/odeme-basarili') && !pathname.startsWith('/odeme-basarisiz')) return;
    if (!shouldRedirectFromWebapi(hostname)) return;
    window.location.replace(`${PUBLIC_MARKETING_ORIGIN}${pathname}${search}${hash}`);
  }, []);
}
