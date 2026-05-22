import { resolveApiUrl } from '@/lib/apiClient';

/**
 * Public sayfa görüntüleme — website-backend POST /api/tracking/pageview
 */
export function trackPageView(path: string, referrer?: string | null): void {
  const url = resolveApiUrl('/api/tracking/pageview');
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, referrer: referrer ?? undefined }),
  })
    .then(async (res) => {
      const text = await res.text();
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      if (!res.ok) {
        console.warn('[trackPageView] HTTP hata', {
          status: res.status,
          path,
          url,
          body,
        });
        return;
      }
      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        (body as { success: boolean }).success === false
      ) {
        console.warn('[trackPageView] API success:false', { path, url, body });
      }
    })
    .catch((err) => {
      console.warn('[trackPageView] Ağ hatası', { path, url, err });
    });
}
