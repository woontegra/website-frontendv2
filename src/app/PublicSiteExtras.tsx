import { useLocation } from 'react-router-dom';
import { CookieConsent } from '@/components/consent/CookieConsent';
import { PublicMetaPixel } from '@/components/tracking/PublicMetaPixel';
import { isPartnerHost } from '@/partner/partnerPaths';

/** Public yüzey: çerez banner + onaylı Meta Pixel (admin / partner portal hariç). */
export function PublicSiteExtras() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  if (pathname.startsWith('/partner') || pathname === '/auth' || isPartnerHost()) return null;

  return (
    <>
      <CookieConsent />
      <PublicMetaPixel />
    </>
  );
}

