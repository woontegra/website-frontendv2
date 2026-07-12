import { apiRequest, resolveApiUrl } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type PublicProduct = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  priceMonthly?: number | null;
  price2Year?: number | null;
  originalPrice2Year?: number | null;
  price3Year?: number | null;
  originalPrice3Year?: number | null;
  price2YearActive?: boolean;
  price3YearActive?: boolean;
  imageUrl?: string;
  shortDescription?: string;
  longDescription?: string | null;
  features?: string[];
  targetAudience?: string[];
  trustInfo?: {
    securePayment?: string;
    invoiceReceipt?: string;
  };
};

export async function fetchPublicProduct(): Promise<ApiEnvelope<PublicProduct | null>> {
  const url = `${resolveApiUrl('/api/product')}?t=${Date.now()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  return res.json();
}

export async function fetchAuthMe(): Promise<ApiEnvelope<unknown>> {
  try {
    return await apiRequest<ApiEnvelope<unknown>>('/api/auth/me', {
      method: 'GET',
      headers: authHeaders(),
    });
  } catch {
    return { success: false };
  }
}

export async function fetchPublicSettings(): Promise<{
  contactEmail?: string;
  phone?: string;
  address?: string;
}> {
  try {
    const res = await fetch(resolveApiUrl('/api/public/settings'));
    const json = (await res.json()) as ApiEnvelope<{
      contactEmail?: string;
      phone?: string;
      address?: string;
    }>;
    return json.data ?? {};
  } catch {
    return {};
  }
}

export async function fetchPageBySlug(slug: string): Promise<{ title?: string; content?: string } | null> {
  try {
    const res = await fetch(resolveApiUrl(`/api/pages/slug/${slug}`));
    const json = (await res.json()) as ApiEnvelope<{ title?: string; content?: string }>;
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export type Campaign = {
  id: string;
  name: string;
  slug?: string;
  discountRate: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: string;
};

export async function fetchCampaignById(id: string): Promise<Campaign | null> {
  try {
    const json = await apiRequest<ApiEnvelope<Campaign>>(`/api/campaigns/id/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export type PaytrTokenResponse = ApiEnvelope<{ token?: string }> & { token?: string };

export type ContactMessagePayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
};

export type DemoRequestPayload = {
  email: string;
  name: string;
  phone: string;
  company?: string;
};

export async function submitDemoRequest(
  data: DemoRequestPayload,
): Promise<ApiEnvelope<unknown>> {
  const res = await fetch(resolveApiUrl('/api/demo/request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as ApiEnvelope<unknown> & { error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Demo talebi gönderilemedi');
  }
  return json;
}

export async function submitContactMessage(
  data: ContactMessagePayload,
): Promise<ApiEnvelope<unknown>> {
  const res = await fetch(resolveApiUrl('/api/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as ApiEnvelope<unknown> & { error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Mesaj gönderilemedi');
  }
  return json;
}

export async function confirmPaymentManualCallback(
  merchantOid: string,
): Promise<ApiEnvelope<unknown>> {
  return apiRequest<ApiEnvelope<unknown>>('/api/payment/manual-callback', {
    method: 'POST',
    body: { merchant_oid: merchantOid },
  });
}

export type PublicPaymentStatusData = {
  found: boolean;
  merchantOid: string;
  status: string;
  updatedAt: string;
  userExists: boolean;
  productType: string | null;
  amount: number;
  hasEmail: boolean;
};

/** Salt okunur ödeme durumu (callback / aktivasyon tetiklemez). */
export async function fetchPaymentPublicStatus(merchantOid: string): Promise<{
  ok: boolean;
  status: number;
  data?: PublicPaymentStatusData;
  message?: string;
}> {
  const url = resolveApiUrl(
    `/api/payment/public-status?merchant_oid=${encodeURIComponent(merchantOid)}`,
  );
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: PublicPaymentStatusData;
    message?: string;
  };
  if (res.ok && json.success && json.data) {
    return { ok: true, status: res.status, data: json.data };
  }
  return {
    ok: false,
    status: res.status,
    message: typeof json.message === 'string' ? json.message : undefined,
  };
}

export async function requestPaytrToken(params: {
  subscriptionPeriod: number;
  productType: 'monthly' | 'annual';
  billingInfo?: Record<string, unknown>;
  campaignId?: string;
  authenticated: boolean;
  legalConsents?: Record<string, boolean>;
}): Promise<PaytrTokenResponse> {
  const body = {
    subscriptionPeriod: params.subscriptionPeriod,
    product_type: params.productType,
    ...(params.billingInfo && { billingInfo: params.billingInfo }),
    ...(params.campaignId && { campaignId: params.campaignId }),
    ...(params.legalConsents && { legalConsents: params.legalConsents }),
  };
  const path = params.authenticated ? '/api/payment/paytr-token' : '/api/payment/paytr-token-guest';
  return apiRequest<PaytrTokenResponse>(path, {
    method: 'POST',
    body,
    headers: authHeaders(),
  });
}

export type BankTransferAvailability = {
  isActive: boolean;
};

export async function fetchBankTransferAvailability(): Promise<BankTransferAvailability> {
  const res = await fetch(resolveApiUrl('/api/payment/bank-transfer-availability'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const json = (await res.json()) as ApiEnvelope<BankTransferAvailability> & {
    isActive?: boolean;
  };
  if (json.success && typeof json.isActive === 'boolean') {
    return { isActive: json.isActive };
  }
  if (json.success && json.data) {
    return json.data;
  }
  return { isActive: false };
}

export type BankTransferOrderBankInfo = {
  bankName: string;
  accountHolderName: string;
  iban: string;
  branchInfo: string;
  instructions: string;
  reference: string;
};

export type BankTransferOrderResponse = {
  merchantOid: string;
  paymentMethod: string;
  status: string;
  amount: number;
  amountFormatted: string;
  bankTransfer: BankTransferOrderBankInfo;
};

export async function requestBankTransferOrder(params: {
  subscriptionPeriod: number;
  productType: 'monthly' | 'annual';
  billingInfo: Record<string, unknown>;
  campaignId?: string;
  legalConsents?: Record<string, boolean>;
  customerNote?: string;
}): Promise<BankTransferOrderResponse> {
  const body = {
    subscriptionPeriod: params.subscriptionPeriod,
    productType: params.productType,
    billingInfo: params.billingInfo,
    ...(params.campaignId && { campaignId: params.campaignId }),
    ...(params.legalConsents && { legalConsents: params.legalConsents }),
    ...(params.customerNote?.trim() && { customerNote: params.customerNote.trim() }),
  };
  const json = await apiRequest<ApiEnvelope<BankTransferOrderResponse> & BankTransferOrderResponse>(
    '/api/payment/bank-transfer-order',
    {
      method: 'POST',
      body,
    },
  );
  if (!json.success) {
    throw new Error(json.message ?? 'Havale/EFT siparişi oluşturulamadı');
  }
  if (json.merchantOid && json.bankTransfer) {
    return json as BankTransferOrderResponse;
  }
  if (json.data) {
    return json.data;
  }
  throw new Error(json.message ?? 'Havale/EFT siparişi oluşturulamadı');
}

export async function fetchPublicBankTransferOrder(
  merchantOid: string,
): Promise<BankTransferOrderResponse | null> {
  const res = await fetch(
    resolveApiUrl(`/api/payment/bank-transfer-order/${encodeURIComponent(merchantOid)}`),
    { method: 'GET', headers: { Accept: 'application/json' } },
  );
  const json = (await res.json()) as ApiEnvelope<BankTransferOrderResponse> &
    BankTransferOrderResponse;
  if (!res.ok || !json.success) return null;
  if (json.merchantOid && json.bankTransfer) {
    return json as BankTransferOrderResponse;
  }
  return json.data ?? null;
}
