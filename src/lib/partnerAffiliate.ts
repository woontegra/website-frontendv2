import { apiRequest } from '@/lib/apiClient';
import { affiliateSaleTypeLabel } from '@/lib/affiliateUiLabels';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type PartnerMe = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  defaultCommissionRate: number;
};

export type PartnerSummary = {
  saleCount: number;
  totalGrossPaidAmountKurus: number;
  totalCommissionBaseAmountKurus: number;
  lifetimeEarnedCommissionKurus: number;
  paidCommissionKurus: number;
  pendingCommissionKurus: number;
};

export type PartnerLink = {
  id: string;
  code: string;
  isActive: boolean;
  expiresAt?: string | null;
  customerDiscountRate: number;
  commissionRate: number;
  fullUrl: string;
};

export type PartnerCommission = {
  id: string;
  saleType: string;
  productType?: string | null;
  subscriptionPeriod?: number | null;
  grossPaidAmountKurus: number;
  commissionRateSnapshot: number;
  commissionAmountKurus: number;
  paidAmountKurus?: number;
  remainingAmountKurus?: number;
  status: string;
  createdAt: string;
  saleRef: string;
};

export type PartnerPayout = {
  id: string;
  amountKurus: number;
  currency: string;
  paymentMethod: string;
  reference?: string | null;
  status: string;
  paidAt: string;
  createdAt: string;
};

const BASE = '/api/partner';

export function formatPartnerTry(kurus: number | null | undefined): string {
  const value = Number(kurus ?? 0);
  return `${(value / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}

export function partnerSaleTypeLabel(saleType: string): string {
  return affiliateSaleTypeLabel(saleType);
}

export async function partnerConsumeMagic(token: string): Promise<PartnerMe> {
  const json = await apiRequest<ApiEnvelope<{ affiliate: PartnerMe }>>(
    `${BASE}/auth/consume`,
    {
      method: 'POST',
      credentials: 'include',
      body: { token },
    },
  );
  if (!json.success || !json.data?.affiliate) {
    throw new Error(json.message ?? 'Giriş başarısız');
  }
  return json.data.affiliate;
}

/**
 * Deduplicate concurrent consume for the same token (React StrictMode remount).
 * Single-use magic tokens must not be POSTed twice.
 */
const partnerMagicConsumeInflight = new Map<string, Promise<PartnerMe>>();

export function partnerConsumeMagicOnce(token: string): Promise<PartnerMe> {
  const key = String(token || '').trim();
  const existing = partnerMagicConsumeInflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      return await partnerConsumeMagic(key);
    } catch (err) {
      // Twin request may have already set bh_partner_sid
      try {
        return await fetchPartnerMe();
      } catch {
        throw err;
      }
    }
  })();

  partnerMagicConsumeInflight.set(key, promise);
  return promise;
}

export async function partnerLogout(): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(`${BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchPartnerMe(): Promise<PartnerMe> {
  const json = await apiRequest<ApiEnvelope<PartnerMe>>(`${BASE}/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Oturum yok');
  return json.data;
}

export async function fetchPartnerSummary(): Promise<PartnerSummary> {
  const json = await apiRequest<ApiEnvelope<PartnerSummary>>(`${BASE}/summary`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Özet yüklenemedi');
  return json.data;
}

export async function fetchPartnerLinks(): Promise<PartnerLink[]> {
  const json = await apiRequest<ApiEnvelope<{ items: PartnerLink[] }>>(`${BASE}/links`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Linkler yüklenemedi');
  return json.data.items;
}

export async function fetchPartnerCommissions(params?: {
  page?: number;
  limit?: number;
  pageSize?: number;
}): Promise<{
  summary: PartnerSummary;
  items: PartnerCommission[];
  pagination: {
    page: number;
    limit: number;
    pageSize?: number;
    total: number;
    totalPages: number;
  };
}> {
  const qs = new URLSearchParams();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? params?.pageSize ?? 10;
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  const json = await apiRequest<
    ApiEnvelope<{
      summary: PartnerSummary;
      items: PartnerCommission[];
      pagination: {
        page: number;
        limit: number;
        pageSize?: number;
        total: number;
        totalPages: number;
      };
    }>
  >(`${BASE}/commissions?${qs}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Satışlar yüklenemedi');
  return json.data;
}

export async function fetchPartnerPayouts(params?: {
  page?: number;
  limit?: number;
  pageSize?: number;
}): Promise<{
  items: PartnerPayout[];
  pagination: {
    page: number;
    limit: number;
    pageSize?: number;
    total: number;
    totalPages: number;
  };
}> {
  const qs = new URLSearchParams();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? params?.pageSize ?? 10;
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  const json = await apiRequest<
    ApiEnvelope<{
      items: PartnerPayout[];
      pagination: {
        page: number;
        limit: number;
        pageSize?: number;
        total: number;
        totalPages: number;
      };
    }>
  >(`${BASE}/payouts?${qs}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Ödemeler yüklenemedi');
  return json.data;
}
