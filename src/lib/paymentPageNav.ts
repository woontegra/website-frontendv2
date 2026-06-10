/**
 * Ödeme sonuç sayfaları yanlışlıkla API kökünde (ör. webapi.*) açıldığında
 * "/" gibi SPA içi yollar API domain'inde kalır. Pazarlama sitesine yönlendirmek için kullanılır.
 */
const envOrigin = (import.meta.env.VITE_PUBLIC_WEBSITE_ORIGIN as string | undefined)
  ?.trim()
  .replace(/\/$/, '');

const DEFAULT_MARKETING_ORIGIN = 'https://www.bilirkisihesap.com';

function marketingOrigin(): string {
  return envOrigin || DEFAULT_MARKETING_ORIGIN;
}

export function isPaymentPageOnApiHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  return h === 'webapi.bilirkisihesap.com' || h.startsWith('webapi.');
}

export type PaymentNavLink = {
  href: string;
  external: boolean;
  /** API hostundan siteye geçerken yeni sekme açılmasın */
  externalTarget?: '_blank' | '_self';
};

/** Ana site veya pazarlama origin üzerindeki path (ödeme sonrası butonlar). */
export function paymentPageInternalNav(path: string): PaymentNavLink {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!isPaymentPageOnApiHost()) {
    return { href: p, external: false };
  }
  return {
    href: `${marketingOrigin()}${p}`,
    external: true,
    externalTarget: '_self',
  };
}
