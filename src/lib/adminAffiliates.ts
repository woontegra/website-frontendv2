import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import { affiliateSaleTypeLabel } from '@/lib/affiliateUiLabels';

export type AdminAffiliateFinancials = {
  saleCount: number;
  totalGrossPaidAmountKurus: number;
  lifetimeEarnedCommissionKurus: number;
  paidCommissionKurus: number;
  pendingCommissionKurus: number;
  totalCommissionBaseAmountKurus?: number;
};

export type AdminAffiliate = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  defaultCommissionRate: number;
  isActive: boolean;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { links: number };
  links?: AdminAffiliateLink[];
  financials?: AdminAffiliateFinancials;
  partnerAccess?: {
    id: string;
    email: string;
    isRevoked: boolean;
    createdAt: string;
    revokedAt?: string | null;
  } | null;
};

export type AdminAffiliateLink = {
  id: string;
  affiliateId: string;
  code: string;
  isActive: boolean;
  expiresAt?: string | null;
  customerDiscountRate: number;
  commissionRateOverride?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAffiliateInput = {
  name: string;
  defaultCommissionRate: number;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  internalNotes?: string | null;
};

export type AdminAffiliatePlatformSummary = {
  totalAffiliates: number;
  activeAffiliates: number;
  inactiveAffiliates: number;
  saleCount: number;
  totalGrossPaidAmountKurus: number;
  totalCommissionBaseAmountKurus: number;
  lifetimeEarnedCommissionKurus: number;
  paidCommissionKurus: number;
  pendingCommissionKurus: number;
  payoutRecordCount: number;
  payoutAmountKurus: number;
};

export type AdminAffiliateCommission = {
  id: string;
  merchantOid?: string;
  saleType: string;
  productType?: string | null;
  subscriptionPeriod?: number | null;
  grossPaidAmountKurus: number;
  commissionBaseAmountKurus?: number;
  commissionRateSnapshot: number;
  commissionAmountKurus: number;
  vatRateSnapshot?: number;
  status: string;
  createdAt: string;
  effectiveCustomerDiscountRateSnapshot?: number;
  /** Sum of payout allocations (kurus). */
  paidAmountKurus?: number;
  /** commissionAmountKurus - paidAmountKurus. */
  remainingAmountKurus?: number;
};

export type AdminAffiliateCommissionPayload = {
  summary: {
    saleCount: number;
    totalGrossPaidAmountKurus: number;
    totalCommissionBaseAmountKurus: number;
    lifetimeEarnedCommissionKurus: number;
    paidCommissionKurus: number;
    pendingCommissionKurus: number;
    totalCommissionAmountKurus?: number;
  };
  items: AdminAffiliateCommission[];
  pagination: {
    page: number;
    limit?: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type AdminAffiliatePayout = {
  id: string;
  amountKurus: number;
  currency: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  status: string;
  paidAt: string;
  createdAt: string;
  items?: Array<{ id: string; commissionId: string; allocatedAmountKurus: number }>;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  idempotent?: boolean;
};

type ListPayload = {
  items: AdminAffiliate[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const BASE = '/api/affiliates';

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token gerekli.',
    };
    throw error;
  }
  return { Authorization: `Bearer ${token}` };
}

export function formatAffiliateTry(kurus: number | null | undefined): string {
  const value = Number(kurus ?? 0);
  return `${(value / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}

export function saleTypeLabel(saleType: string): string {
  return affiliateSaleTypeLabel(saleType);
}

export function affiliateReferralPublicLink(
  linkOrCode: Pick<AdminAffiliateLink, 'code'> | string,
): string {
  const code = typeof linkOrCode === 'string' ? linkOrCode : linkOrCode.code;
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://bilirkisihesap.com';
  return `${origin.replace(/\/$/, '')}/r/${encodeURIComponent(code)}`;
}

export async function fetchAdminAffiliateSummary(params?: {
  preset?: string;
  from?: string;
  to?: string;
}): Promise<AdminAffiliatePlatformSummary> {
  const qs = new URLSearchParams();
  if (params?.preset) qs.set('preset', params.preset);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs}` : '';
  const json = await apiRequest<ApiEnvelope<AdminAffiliatePlatformSummary>>(
    `${BASE}/admin/summary${suffix}`,
    { method: 'GET', headers: authHeaders() },
  );
  if (!json.success || !json.data) throw new Error(json.message ?? 'Özet yüklenemedi');
  return json.data;
}

export async function fetchAdminAffiliates(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  preset?: string;
}): Promise<ListPayload> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.preset) qs.set('preset', params.preset);
  const suffix = qs.toString() ? `?${qs}` : '';
  const json = await apiRequest<ApiEnvelope<ListPayload>>(`${BASE}/admin${suffix}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'İş ortakları yüklenemedi');
  }
  return json.data;
}

export async function fetchAdminAffiliate(id: string): Promise<AdminAffiliate> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliate>>(`${BASE}/admin/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'İş ortağı bulunamadı');
  }
  return json.data;
}

export async function createAdminAffiliate(input: AdminAffiliateInput): Promise<AdminAffiliate> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliate>>(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: input,
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'İş ortağı oluşturulamadı');
  }
  return json.data;
}

export async function updateAdminAffiliate(
  id: string,
  input: Partial<AdminAffiliateInput>,
): Promise<AdminAffiliate> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliate>>(`${BASE}/admin/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: input,
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'İş ortağı güncellenemedi');
  }
  return json.data;
}

export async function activateAdminAffiliate(id: string): Promise<AdminAffiliate> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliate>>(`${BASE}/admin/${id}/activate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Aktifleştirme başarısız');
  }
  return json.data;
}

export async function deactivateAdminAffiliate(id: string): Promise<AdminAffiliate> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliate>>(`${BASE}/admin/${id}/deactivate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Pasifleştirme başarısız');
  }
  return json.data;
}

export async function deleteAdminAffiliate(id: string): Promise<{ id: string; deleted: boolean }> {
  const json = await apiRequest<ApiEnvelope<{ id: string; deleted: boolean }>>(
    `${BASE}/admin/${id}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Silme başarısız');
  }
  return json.data;
}

export type AdminAffiliateDeletePreview = {
  affiliateId: string;
  name: string;
  canDelete: boolean;
  blockReasons: string[];
  counts: {
    links: number;
    attributions: number;
    commissions: number;
    payouts: number;
    payoutItems: number;
    paymentsToNull: number;
    auditLogs: number;
    partnerAccess: number;
    partnerMagicTokens: number;
    partnerSessions: number;
    paidCommissions: number;
    earnedCommissions: number;
    productionPaymentsLinked: number;
    testPaymentsLinked: number;
  };
  actions: {
    delete: string[];
    nullify: string[];
    preserve: string[];
  } | null;
};

export async function fetchAdminAffiliateDeletePreview(
  id: string,
): Promise<AdminAffiliateDeletePreview> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliateDeletePreview>>(
    `${BASE}/admin/${id}/delete-preview`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Silme önizlemesi yüklenemedi');
  }
  return json.data;
}

export async function createAdminAffiliateLink(
  affiliateId: string,
  body?: {
    expiresAt?: string | null;
    customerDiscountRate?: number;
    commissionRateOverride?: number | null;
  },
): Promise<AdminAffiliateLink> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliateLink>>(
    `${BASE}/admin/${affiliateId}/links`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: body ?? {},
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Link oluşturulamadı');
  }
  return json.data;
}

export async function updateAdminAffiliateLink(
  linkId: string,
  body: {
    customerDiscountRate?: number;
    commissionRateOverride?: number | null;
    expiresAt?: string | null;
  },
): Promise<AdminAffiliateLink> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliateLink>>(
    `${BASE}/admin/links/${linkId}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body,
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Link güncellenemedi');
  }
  return json.data;
}

export async function fetchAdminAffiliateCommissions(
  affiliateId: string,
  params?: {
    page?: number;
    limit?: number;
    pageSize?: number;
    preset?: string;
    status?: string;
  },
): Promise<AdminAffiliateCommissionPayload> {
  const qs = new URLSearchParams();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? params?.pageSize ?? 10;
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (params?.preset) qs.set('preset', params.preset);
  if (params?.status) qs.set('status', params.status);
  const json = await apiRequest<ApiEnvelope<AdminAffiliateCommissionPayload>>(
    `${BASE}/admin/${affiliateId}/commissions?${qs}`,
    { method: 'GET', headers: authHeaders() },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Komisyonlar yüklenemedi');
  }
  return json.data;
}

export async function fetchAdminAffiliatePayouts(
  affiliateId: string,
  params?: { page?: number; limit?: number; pageSize?: number },
): Promise<{ items: AdminAffiliatePayout[]; pagination: AdminAffiliateCommissionPayload['pagination'] }> {
  const qs = new URLSearchParams();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? params?.pageSize ?? 10;
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  const json = await apiRequest<
    ApiEnvelope<{ items: AdminAffiliatePayout[]; pagination: AdminAffiliateCommissionPayload['pagination'] }>
  >(`${BASE}/admin/${affiliateId}/payouts?${qs}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Ödemeler yüklenemedi');
  return json.data;
}

export async function fetchAdminEarnedCommissions(
  affiliateId: string,
): Promise<AdminAffiliateCommission[]> {
  const json = await apiRequest<ApiEnvelope<{ items: AdminAffiliateCommission[] }>>(
    `${BASE}/admin/${affiliateId}/payouts/earned`,
    { method: 'GET', headers: authHeaders() },
  );
  if (!json.success || !json.data) throw new Error(json.message ?? 'Bekleyen komisyonlar yüklenemedi');
  return json.data.items;
}

export async function createAdminAffiliatePayout(
  affiliateId: string,
  body: {
    allocations?: Array<{ commissionId: string; amountKurus: number }>;
    commissionIds?: string[];
    paymentMethod: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
    idempotencyKey: string;
  },
): Promise<AdminAffiliatePayout> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliatePayout>>(
    `${BASE}/admin/${affiliateId}/payouts`,
    { method: 'POST', headers: authHeaders(), body },
  );
  if (!json.success || !json.data) throw new Error(json.message ?? 'Ödeme kaydı oluşturulamadı');
  return json.data;
}

export async function inviteAdminPartnerAccess(affiliateId: string): Promise<{
  access: { id: string; email: string; isRevoked: boolean };
  magicUrl: string;
  expiresAt: string;
}> {
  const json = await apiRequest<
    ApiEnvelope<{
      access: { id: string; email: string; isRevoked: boolean };
      magicUrl: string;
      expiresAt: string;
    }>
  >(`${BASE}/admin/${affiliateId}/partner-access/invite`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) throw new Error(json.message ?? 'Partner erişimi oluşturulamadı');
  return json.data;
}

export async function revokeAdminPartnerAccess(affiliateId: string): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>(
    `${BASE}/admin/${affiliateId}/partner-access/revoke`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!json.success) throw new Error(json.message ?? 'Partner erişimi iptal edilemedi');
}

export async function activateAdminAffiliateLink(linkId: string): Promise<AdminAffiliateLink> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliateLink>>(
    `${BASE}/admin/links/${linkId}/activate`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Link aktifleştirilemedi');
  }
  return json.data;
}

export async function deactivateAdminAffiliateLink(linkId: string): Promise<AdminAffiliateLink> {
  const json = await apiRequest<ApiEnvelope<AdminAffiliateLink>>(
    `${BASE}/admin/links/${linkId}/deactivate`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Link pasifleştirilemedi');
  }
  return json.data;
}
