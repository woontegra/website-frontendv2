/**
 * Merkezi site yapılandırması.
 * Canlı değerler sonraki aşamada ortam değişkenleri veya deploy ayarı ile güncellenebilir.
 */
export const config = {
  /** Dev: Vite proxy (/api → backend). Prod: VITE_API_BASE_URL veya localhost:3001 */
  API_BASE_URL:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.DEV ? '' : 'http://localhost:3001'),
  PANEL_LOGIN_URL: 'https://panel.example.com/giris',
  PAYMENT_MONTHLY_URL: 'https://www.example.com/odeme-aylik',
  PAYMENT_YEARLY_URL: 'https://www.example.com/odeme-yillik',
  YOUTUBE_URL: 'https://www.youtube.com/@bilirkisihesap',
  /** Baro paket kartı fiyatlandırma sayfasında (anlaşma sonrası true). */
  SHOW_BARO_PRICING_PLAN: false,
  siteName: 'Bilirkişi Hesap',
  contactEmail: 'info@bilirkisihesap.com',
  contactPhone: '+90 (212) 000 00 00',
  contactAddress: 'İstanbul, Türkiye',
} as const;

export type SiteConfig = typeof config;
