import { useLocation } from 'react-router-dom';
import { CookieConsent } from '@/components/consent/CookieConsent';
import { PublicMetaPixel } from '@/components/tracking/PublicMetaPixel';

/** Public yüzey: çerez banner + onaylı Meta Pixel (admin hariç). */
export function PublicSiteExtras() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <CookieConsent />
      <PublicMetaPixel />
    </>
  );
}
