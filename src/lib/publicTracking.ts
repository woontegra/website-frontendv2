import { resolveApiUrl } from '@/lib/apiClient';

export type PublicTrackingSettings = {
  metaPixelId?: string | null;
};

/** API ayarı; yoksa VITE_META_PIXEL_ID (deploy env). */
export async function fetchPublicTrackingSettings(): Promise<PublicTrackingSettings> {
  const envPixel = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim();
  try {
    const res = await fetch(resolveApiUrl('/api/public/tracking'));
    const json = (await res.json()) as {
      success?: boolean;
      data?: { metaPixelId?: string | null };
    };
    const fromApi = json.success && json.data?.metaPixelId?.trim();
    return { metaPixelId: fromApi || envPixel || null };
  } catch {
    return { metaPixelId: envPixel || null };
  }
}
