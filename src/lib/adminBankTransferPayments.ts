import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  merchantOid?: string;
  status?: string;
};

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token gerekli');
  return { Authorization: `Bearer ${token}` };
}

export type BankTransferPaymentStatus =
  | 'bank_transfer_pending'
  | 'success'
  | 'bank_transfer_rejected'
  | 'failed';

export type BankTransferPaymentListItem = {
  merchantOid: string;
  email: string | null;
  name: string | null;
  amount: number;
  finalPriceKurus: number | null;
  normalPriceKurus: number | null;
  discountRate: number | null;
  discountAmountKurus: number | null;
  campaignNameSnapshot: string | null;
  productType: string | null;
  subscriptionPeriod: number | null;
  status: string;
  paymentMethod: string;
  bankTransferReference: string | null;
  customerNote: string | null;
  createdAt: string;
  bankTransferApprovedAt: string | null;
  bankTransferRejectedAt: string | null;
  bankTransferRejectionNote: string | null;
};

export type BankTransferPaymentDetail = BankTransferPaymentListItem & {
  bankTransferApprovedBy: string | null;
  bankTransferRejectedBy: string | null;
  legalPackage: {
    id: number;
    packageNo: string;
    orderNo: string;
    status: string;
    productName: string;
    planName: string;
    amount: number;
    acceptedAt: string;
  } | null;
  billingInfo: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    identityNumber: string | null;
    taxNumber: string | null;
  } | null;
};

export type FetchBankTransferPaymentsParams = {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type BankTransferPaymentsListResult = {
  items: BankTransferPaymentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const ALL_STATUSES: BankTransferPaymentStatus[] = [
  'bank_transfer_pending',
  'success',
  'bank_transfer_rejected',
  'failed',
];

function buildQuery(params: FetchBankTransferPaymentsParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function fetchBankTransferPaymentsPage(
  params: FetchBankTransferPaymentsParams,
): Promise<BankTransferPaymentsListResult> {
  const json = await apiRequest<ApiEnvelope<BankTransferPaymentsListResult>>(
    `/api/admin/bank-transfer-payments${buildQuery(params)}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Havale ödemeleri yüklenemedi');
  }
  return json.data;
}

export async function fetchAdminBankTransferPayments(
  params: FetchBankTransferPaymentsParams = {},
): Promise<BankTransferPaymentsListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  if (params.status !== 'all') {
    return fetchBankTransferPaymentsPage({
      ...params,
      status: params.status ?? 'bank_transfer_pending',
      page,
      limit,
    });
  }

  const perStatusLimit = Math.max(limit, 50);
  const results = await Promise.all(
    ALL_STATUSES.map((status) =>
      fetchBankTransferPaymentsPage({
        ...params,
        status,
        page: 1,
        limit: perStatusLimit,
      }),
    ),
  );

  const merged = results
    .flatMap((r) => r.items)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const q = params.q?.trim().toLowerCase();
  const filtered = q
    ? merged.filter((item) => {
        const haystack = [
          item.email,
          item.merchantOid,
          item.bankTransferReference,
          item.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
    : merged;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: { page, limit, total, pages },
  };
}

export async function fetchAdminBankTransferPaymentDetail(
  merchantOid: string,
): Promise<BankTransferPaymentDetail> {
  const json = await apiRequest<ApiEnvelope<BankTransferPaymentDetail>>(
    `/api/admin/bank-transfer-payments/${encodeURIComponent(merchantOid)}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Havale ödeme detayı yüklenemedi');
  }
  return json.data;
}

export async function approveAdminBankTransferPayment(merchantOid: string): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>(
    `/api/admin/bank-transfer-payments/${encodeURIComponent(merchantOid)}/approve`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  if (!json.success) {
    throw new Error(json.message ?? 'Havale ödemesi onaylanamadı');
  }
}

export async function rejectAdminBankTransferPayment(
  merchantOid: string,
  rejectionNote?: string,
): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>(
    `/api/admin/bank-transfer-payments/${encodeURIComponent(merchantOid)}/reject`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: { rejectionNote: rejectionNote?.trim() || undefined },
    },
  );
  if (!json.success) {
    throw new Error(json.message ?? 'Havale ödemesi reddedilemedi');
  }
}

export function bankTransferApiErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (apiError?.status === 409) {
    const body = apiError.body as { message?: string; status?: string } | undefined;
    const base = body?.message || apiError.message?.replace(/\s*\(HTTP 409\)$/, '') || 'Bu ödeme zaten işlenmiş olabilir.';
    if (body?.status && body.status !== 'bank_transfer_pending') {
      return `${base} (Durum: ${body.status})`;
    }
    return base;
  }
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu';
}
