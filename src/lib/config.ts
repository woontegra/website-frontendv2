/**
 * Merkezi site yapılandırması.
 * Canlı değerler sonraki aşamada ortam değişkenleri veya deploy ayarı ile güncellenebilir.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  /** Boş = aynı origin (/api → Vite proxy veya Vercel rewrite → Railway) */
  return '';
}

export const config = {
  /** Dev: Vite proxy. Prod: boş + vercel.json /api rewrite; isteğe bağlı VITE_API_BASE_URL */
  API_BASE_URL: resolveApiBaseUrl(),
  PANEL_LOGIN_URL: 'https://panel.example.com/giris',
  PAYMENT_MONTHLY_URL: 'https://www.example.com/odeme-aylik',
  PAYMENT_YEARLY_URL: 'https://www.example.com/odeme-yillik',
  YOUTUBE_URL: 'https://www.youtube.com/@bilirkisihesap',
  /** Baro paket kartı fiyatlandırma sayfasında (anlaşma sonrası true). */
  SHOW_BARO_PRICING_PLAN: false,
  siteName: 'Bilirkişi Hesap',
  contactEmail: 'info@bilirkisihesap.com',
  contactPhone: '0531 586 17 55',
  contactAddress: 'İskele Mahallesi Bademli Caddesi 43/6 Datça-Muğla',
} as const;

export type SiteConfig = typeof config;
