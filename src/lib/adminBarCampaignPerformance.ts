import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

export type BarCampaignPerformanceRow = {
  barAssociationKey: string;
  barAssociationName: string;
  uniqueUserCount: number;
  firstPurchaseCount: number;
  renewalCount: number;
  totalAmountKurus: number;
  lastTransactionAt: string | null;
};

export type BarCampaignUserRow = {
  key: string;
  name: string;
  email: string | null;
  firstPurchaseCount: number;
  renewalCount: number;
  totalAmountKurus: number;
  lastTransactionAt: string | null;
};

export type BarCampaignTransactionRow = {
  merchantOid: string;
  name: string;
  email: string | null;
  orderPurpose: 'NEW' | 'RENEWAL';
  amountKurus: number;
  paymentMethod: string;
  campaignPublicCode: string | null;
  campaignName: string | null;
  transactionAt: string | null;
};

export type BarCampaignPerformanceDetails = {
  barAssociationKey: string;
  barAssociationName: string;
  users: BarCampaignUserRow[];
  transactions: BarCampaignTransactionRow[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = { status: 401, message: 'Admin token gerekli.' };
    throw error;
  }
  return { Authorization: `Bearer ${token}` };
}

export async function fetchBarCampaignPerformance(): Promise<BarCampaignPerformanceRow[]> {
  const json = await apiRequest<ApiEnvelope<BarCampaignPerformanceRow[]>>(
    '/api/campaigns/admin/bar-performance',
    { method: 'GET', headers: authHeaders() },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Baro kampanya performansı yüklenemedi.');
  }
  return json.data;
}

export async function fetchBarCampaignPerformanceDetails(
  barAssociationKey: string,
): Promise<BarCampaignPerformanceDetails> {
  const json = await apiRequest<ApiEnvelope<BarCampaignPerformanceDetails>>(
    `/api/campaigns/admin/bar-performance/${encodeURIComponent(barAssociationKey)}`,
    { method: 'GET', headers: authHeaders() },
  );
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Baro kampanya işlemleri yüklenemedi.');
  }
  return json.data;
}
