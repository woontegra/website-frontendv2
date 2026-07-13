import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token gerekli');
  return { Authorization: `Bearer ${token}` };
}

export type OrderStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'bank_transfer_pending'
  | 'bank_transfer_rejected';

export type PaymentMethodFilter = 'PAYTR' | 'BANK_TRANSFER' | 'all';

export type OrderListItem = {
  merchantOid: string;
  email: string | null;
  paymentMethod: string;
  status: string;
  amount: number;
  finalPriceKurus: number | null;
  normalPriceKurus: number | null;
  discountRate: number | null;
  discountAmountKurus: number | null;
  campaignNameSnapshot: string | null;
  productType: string | null;
  subscriptionPeriod: number | null;
  productName: string | null;
  bankTransferReference: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderLegalPackage = {
  id: number;
  packageNo: string;
  orderNo: string;
  status: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
  acceptedAt: string;
  hasArchive: boolean;
  downloadUrl: string | null;
  downloadTokenExpires: string | null;
  customerName: string;
  customerEmail: string;
};

export type OrderUserProduct = {
  id: number;
  purchasedAt: string;
  expiresAt: string;
  duration: number;
  isExpired: boolean;
};

export type OrderDetail = {
  id: number;
  merchantOid: string;
  email: string | null;
  paymentMethod: string;
  status: string;
  amount: number;
  finalPriceKurus: number | null;
  normalPriceKurus: number | null;
  discountRate: number | null;
  discountAmountKurus: number | null;
  campaignId: string | null;
  campaignNameSnapshot: string | null;
  productType: string | null;
  subscriptionPeriod: number | null;
  productId: number | null;
  product: { id: number; name: string; price: number } | null;
  bankTransferReference: string | null;
  bankTransferApprovedAt: string | null;
  bankTransferApprovedBy: string | null;
  bankTransferRejectedAt: string | null;
  bankTransferRejectedBy: string | null;
  bankTransferRejectionNote: string | null;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
  legalPackage: OrderLegalPackage | null;
  userProduct: OrderUserProduct | null;
};

export type FetchAdminOrdersParams = {
  paymentMethod?: PaymentMethodFilter;
  status?: OrderStatus | 'all';
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type AdminOrdersListResult = {
  items: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function buildQuery(params: FetchAdminOrdersParams): string {
  const search = new URLSearchParams();
  if (params.paymentMethod && params.paymentMethod !== 'all') {
    search.set('paymentMethod', params.paymentMethod);
  }
  if (params.status && params.status !== 'all') {
    search.set('status', params.status);
  }
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAdminOrders(
  params: FetchAdminOrdersParams = {},
): Promise<AdminOrdersListResult> {
  const json = await apiRequest<ApiEnvelope<AdminOrdersListResult>>(
    `/api/admin/orders${buildQuery(params)}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Siparişler yüklenemedi');
  }
  return json.data;
}

export async function fetchAdminOrderDetail(merchantOid: string): Promise<OrderDetail> {
  const json = await apiRequest<ApiEnvelope<OrderDetail>>(
    `/api/admin/orders/${encodeURIComponent(merchantOid)}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Sipariş detayı yüklenemedi');
  }
  return json.data;
}
