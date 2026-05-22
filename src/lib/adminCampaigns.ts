import { apiRequest } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';
import type { ApiError } from '@/lib/apiClient';

export type AdminCampaign = {
  id: string;
  name: string;
  slug: string;
  discountRate: number;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  const json = await apiRequest<ApiEnvelope<AdminCampaign[]>>('/api/campaigns/admin', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Kampanyalar yüklenemedi');
  }
  return json.data;
}

export async function createAdminCampaign(body: {
  name: string;
  discountRate: number;
  usageLimit?: number;
  expiresAt?: string;
}): Promise<{ campaign: AdminCampaign }> {
  const json = await apiRequest<ApiEnvelope<{ campaign: AdminCampaign }>>('/api/campaigns', {
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
  body: Partial<{
    name: string;
    discountRate: number;
    usageLimit: number | null;
    expiresAt: string | null;
    isActive: boolean;
  }>,
): Promise<AdminCampaign> {
  const json = await apiRequest<ApiEnvelope<AdminCampaign>>(`/api/campaigns/admin/${id}`, {
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
  const json = await apiRequest<ApiEnvelope<unknown>>(`/api/campaigns/admin/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!json.success) {
    throw new Error(json.message ?? 'Kampanya silinemedi');
  }
}

export function campaignPublicLink(campaignId: string): string {
  return `${window.location.origin}/k/${campaignId}`;
}

export function campaignCheckoutLink(campaignId: string): string {
  return `${window.location.origin}/satin-al?c=${campaignId}`;
}
