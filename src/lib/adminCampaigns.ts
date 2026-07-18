import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import type { ApiError } from '@/lib/apiClient';

export type AdminCampaign = {
  id: string;
  name: string;
  slug: string;
  publicCode?: string | null;
  discountRate: number;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  campaignType: CampaignType;
  barAssociationKey?: string | null;
  barAssociationNameSnapshot?: string | null;
  appliesToNewPurchase?: boolean;
  appliesToRenewal?: boolean;
  eligibleProductTypes?: CampaignProductType[] | null;
  eligiblePeriods?: number[] | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignType = 'GENERAL' | 'BAR_ASSOCIATION';
export type CampaignProductType = 'monthly' | 'annual';

export type AdminBarAssociation = {
  key: string;
  name: string;
  status?: string | null;
};

export type AdminCampaignInput = {
  name: string;
  discountRate: number;
  usageLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  campaignType?: CampaignType;
  barAssociationKey?: string | null;
  appliesToNewPurchase?: boolean;
  appliesToRenewal?: boolean;
  eligibleProductTypes?: CampaignProductType[];
  eligiblePeriods?: number[];
};

const ADMIN_CAMPAIGNS_PATH = '/api/campaigns';
const ADMIN_CAMPAIGN_LIST_PATH = `${ADMIN_CAMPAIGNS_PATH}/admin`;
const ADMIN_BAR_ASSOCIATIONS_PATH = `${ADMIN_CAMPAIGN_LIST_PATH}/bar-associations`;

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

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

export async function fetchAdminCampaigns(): Promise<AdminCampaign[]> {
  const json = await apiRequest<ApiEnvelope<AdminCampaign[]>>(ADMIN_CAMPAIGN_LIST_PATH, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Kampanyalar yüklenemedi');
  }
  return json.data;
}

export async function fetchAdminBarAssociations(): Promise<AdminBarAssociation[]> {
  const json = await apiRequest<ApiEnvelope<AdminBarAssociation[]>>(ADMIN_BAR_ASSOCIATIONS_PATH, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Baro seçenekleri yüklenemedi');
  }
  return json.data;
}

export async function createAdminCampaign(
  body: AdminCampaignInput,
): Promise<{ campaign: AdminCampaign }> {
  const json = await apiRequest<ApiEnvelope<{ campaign: AdminCampaign }>>(ADMIN_CAMPAIGNS_PATH, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Kampanya oluşturulamadı');
  }
  return json.data;
}

export async function updateAdminCampaign(
  id: string,
  body: Partial<AdminCampaignInput>,
): Promise<AdminCampaign> {
  const json = await apiRequest<ApiEnvelope<AdminCampaign>>(`${ADMIN_CAMPAIGN_LIST_PATH}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body,
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Kampanya güncellenemedi');
  }
  return json.data;
}

export async function deleteAdminCampaign(id: string): Promise<void> {
  const json = await apiRequest<ApiEnvelope<unknown>>(`${ADMIN_CAMPAIGN_LIST_PATH}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Kampanya silinemedi');
  }
}

export function campaignPublicLink(campaign: Pick<AdminCampaign, 'id' | 'publicCode'> | string): string {
  const code = typeof campaign === 'string' ? campaign : campaign.publicCode || campaign.id;
  return `${window.location.origin}/k/${encodeURIComponent(code)}`;
}

export function campaignCheckoutLink(campaign: Pick<AdminCampaign, 'id' | 'publicCode'> | string): string {
  const code = typeof campaign === 'string' ? campaign : campaign.publicCode || campaign.id;
  return `${window.location.origin}/satin-al?c=${encodeURIComponent(code)}`;
}
