import { resolvePublicAssetUrl } from './resolvePublicAssetUrl';

/** Yıllık paket kartı rozeti — iki satır */
export const ANNUAL_GIFT_BADGE_LINES = [
  'Yıllık Pakete Özel',
  'Müvekkil Kasa Takip Programı Hediye',
] as const;

export const ANNUAL_GIFT_SECTION_TITLE = 'Yıllık Aboneliğe Özel Hediye';

export const ANNUAL_GIFT_SECTION_SUBTITLE =
  '1 yıllık Müvekkil Kasa Takip Programı lisansı hediye';

export const ANNUAL_GIFT_SECTION_INTRO =
  '1 yıllık Bilirkişi Hesap aboneliği satın alan kullanıcılarımıza, hukuk bürolarının günlük finansal takibini kolaylaştıran Müvekkil Kasa Takip Programı 1 yıl süreyle hediye edilir.';

export const ANNUAL_GIFT_SECTION_DESCRIPTION =
  'Müvekkil Kasa Takip Programı; avukatların ve hukuk bürolarının müvekkil tahsilatlarını, ödeme ve masraf kayıtlarını, müvekkil kasa hareketlerini ve ofis kasa giriş-çıkışlarını düzenli şekilde takip etmesini sağlayan masaüstü iş takip programıdır.';

export const ANNUAL_GIFT_SECTION_FEATURES = [
  'Müvekkil tahsilatlarını kolayca takip edin',
  'Ödeme ve masraf kayıtlarını yönetin',
  'Müvekkil kasa hareketlerini izleyin',
  'Ofis kasa giriş ve çıkışlarını kontrol edin',
  'Raporlarla finansal durumunuzu net görün',
] as const;

export const ANNUAL_GIFT_SECTION_FOOTNOTE =
  'Hediye lisans, ödeme işleminin ardından kayıtlı e-posta adresiniz üzerinden tanımlanır.';

/**
 * Müvekkil Kasa tanıtım görseli.
 * Öncelik: VITE_MUVEKKIL_KASA_PROMO_IMAGE → public/images/muvekkil-kasa-takip-promo.png
 * Yedek: hero-doldurulmus-form.png (görsel eklenene kadar)
 */
export const MUVEKKIL_KASA_GIFT_PROMO_IMAGE = {
  alt: 'Müvekkil Kasa Takip Programı arayüzü',
  get src(): string {
    const fromEnv = (import.meta.env.VITE_MUVEKKIL_KASA_PROMO_IMAGE as string | undefined)?.trim();
    const path = fromEnv || '/images/muvekkil-kasa-takip-promo.png';
    return resolvePublicAssetUrl(path);
  },
  get fallbackSrc(): string {
    return resolvePublicAssetUrl('/images/hero-doldurulmus-form.png');
  },
};
