import { apiRequest, resolveApiUrl, type ApiError } from './apiClient';
import { getAdminToken } from './adminAuth';

export type AdminV2PatchEnvelope<T> = {
  success: boolean;
  data: T;
};

/** PATCH yolları — website-backend v2AdminRoutes.js ile birebir */
export const ADMIN_V2_PATCH_ROUTES = {
  settings: (key: string) => `/api/admin/v2/settings/${encodeURIComponent(key)}`,
  module: (id: number | string) => `/api/admin/v2/modules/${encodeURIComponent(String(id))}`,
  pricingPlan: (id: number | string) => `/api/admin/v2/pricing/plans/${encodeURIComponent(String(id))}`,
  faqCategory: (id: number | string) => `/api/admin/v2/faq/categories/${encodeURIComponent(String(id))}`,
  faqItem: (id: number | string) => `/api/admin/v2/faq/items/${encodeURIComponent(String(id))}`,
  homepageSection: (sectionKey: string) =>
    `/api/admin/v2/homepage/sections/${encodeURIComponent(sectionKey)}`,
  contactSetting: () => '/api/admin/v2/contact/setting',
  supportCard: (id: number | string) =>
    `/api/admin/v2/contact/support-cards/${encodeURIComponent(String(id))}`,
  seo: (id: number | string) => `/api/admin/v2/seo/${encodeURIComponent(String(id))}`,
  trustMetric: (id: number | string) =>
    `/api/admin/v2/marketing/trust-metrics/${encodeURIComponent(String(id))}`,
  ctaButton: (id: number | string) =>
    `/api/admin/v2/marketing/cta-buttons/${encodeURIComponent(String(id))}`,
  pageContent: (id: number | string) =>
    `/api/admin/v2/pages/contents/${encodeURIComponent(String(id))}`,
  pageCard: (id: number | string) => `/api/admin/v2/pages/cards/${encodeURIComponent(String(id))}`,
  media: (id: number | string) => `/api/admin/v2/media/${encodeURIComponent(String(id))}`,
} as const;

export function parseAdminNumericId(id: string): number | null {
  const n = Number.parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export async function adminV2Patch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message: 'Admin token bulunamadı. Kaydetmek için önce token kaydedin.',
      url: resolveApiUrl(path),
      method: 'PATCH',
    };
    throw error;
  }

  try {
    const result = await apiRequest<AdminV2PatchEnvelope<T>>(path, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      (result as AdminV2PatchEnvelope<T>).success === false
    ) {
      const error: ApiError = {
        status: 400,
        message: `PATCH başarısız — ${resolveApiUrl(path)}`,
        url: resolveApiUrl(path),
        method: 'PATCH',
        body: result,
      };
      throw error;
    }

    if (result && typeof result === 'object' && 'data' in result) {
      return (result as AdminV2PatchEnvelope<T>).data;
    }

    return result as T;
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.url && apiErr.method === 'PATCH' && !apiErr.message.includes(apiErr.url)) {
      apiErr.message = `${apiErr.message} — PATCH ${apiErr.url}`;
    }
    throw apiErr;
  }
}
