import { apiRequest } from '@/lib/apiClient';
import { clearAdminToken, normalizeAdminToken, setAdminToken } from '@/lib/adminAuth';

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

type LoginEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
    accessToken?: string;
    user?: AdminUser;
  };
};

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const json = await apiRequest<LoginEnvelope>('/api/auth/login', {
    method: 'POST',
    body: { email: email.trim(), password },
  });

  if (!json.success || !json.data?.user) {
    throw new Error(json.message ?? 'Giriş başarısız');
  }

  if (json.data.user.role !== 'admin') {
    throw new Error('Bu hesap admin yetkisine sahip değil.');
  }

  const token = normalizeAdminToken(json.data.token ?? json.data.accessToken ?? '');
  if (!token) {
    throw new Error('Oturum token alınamadı.');
  }

  setAdminToken(token);
  return json.data.user;
}

export async function adminLogout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // Oturum sunucuda kalsa bile yerel token temizlenir
  } finally {
    clearAdminToken();
  }
}
