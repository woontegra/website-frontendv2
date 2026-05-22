import { apiRequest, type ApiError } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminAuth';

type EnsureFooterResponse = {
  success: boolean;
  message?: string;
  data?: { brandId: number; copyrightId: number; navCardIds: number[] };
};

export async function ensureAdminV2FooterLayout(): Promise<EnsureFooterResponse['data']> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
    };
    throw error;
  }

  const json = await apiRequest<EnsureFooterResponse>('/api/admin/v2/pages/layout/footer/ensure', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!json.success) {
    throw new Error(json.message ?? 'Footer oluşturulamadı');
  }

  return json.data;
}
