/**
 * Presentation-only Turkish labels for affiliate admin + partner portal.
 * Does not change API/DB enum values.
 */

export function productTypeLabel(productType: string | null | undefined): string {
  const t = String(productType ?? '')
    .trim()
    .toLowerCase();
  if (t === 'annual' || t === 'yearly') return 'Yıllık';
  if (t === 'monthly') return 'Aylık';
  if (!t) return '—';
  return String(productType).trim();
}

/**
 * Period display: annual uses years; monthly treats 0 as 1 ay (checkout convention).
 */
export function subscriptionPeriodLabel(
  productType: string | null | undefined,
  subscriptionPeriod: number | null | undefined,
): string | null {
  if (subscriptionPeriod == null || Number.isNaN(Number(subscriptionPeriod))) return null;
  const period = Number(subscriptionPeriod);
  const t = String(productType ?? '')
    .trim()
    .toLowerCase();
  if (t === 'monthly') {
    const months = period === 0 ? 1 : period;
    return `${months} Ay`;
  }
  if (t === 'annual' || t === 'yearly' || t === '') {
    return `${period} Yıl`;
  }
  return String(period);
}

/** e.g. "Yıllık / 1 Yıl" or "Aylık / 1 Ay" */
export function affiliatePackageLabel(
  productType: string | null | undefined,
  subscriptionPeriod: number | null | undefined,
): string {
  const type = productTypeLabel(productType);
  const period = subscriptionPeriodLabel(productType, subscriptionPeriod);
  if (type === '—' && period == null) return '—';
  if (period) return `${type} / ${period}`;
  return type;
}

export function affiliateSaleTypeLabel(saleType: string | null | undefined): string {
  const s = String(saleType ?? '').trim();
  if (s === 'FIRST_SALE') return 'İlk Satış';
  if (s === 'RENEWAL') return 'Yenileme';
  return s || '—';
}

export function affiliateCommissionStatusLabel(status: string | null | undefined): string {
  const s = String(status ?? '').trim();
  if (s === 'EARNED') return 'Hak Edildi';
  if (s === 'PARTIALLY_PAID') return 'Kısmen Ödendi';
  if (s === 'PAID') return 'Ödendi';
  if (s === 'REVERSED' || s === 'CANCELLED' || s === 'CANCELED') return 'İptal / İade Edildi';
  return s || '—';
}

export function affiliatePayoutStatusLabel(status: string | null | undefined): string {
  const s = String(status ?? '').trim();
  if (s === 'PAID') return 'Ödendi';
  if (s === 'PENDING') return 'Beklemede';
  if (s === 'FAILED' || s === 'CANCELLED' || s === 'CANCELED') return 'İptal';
  return s || '—';
}

export function affiliatePaymentMethodLabel(method: string | null | undefined): string {
  const m = String(method ?? '').trim();
  if (m === 'BANK_TRANSFER') return 'Banka havalesi';
  if (m === 'CASH') return 'Nakit';
  if (m === 'OTHER') return 'Diğer';
  if (m === 'PAYTR' || m === 'CARD') return 'Kart';
  return m || '—';
}
