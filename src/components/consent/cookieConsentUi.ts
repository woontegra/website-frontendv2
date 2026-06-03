import type { CookieCategory } from '@/lib/cookieConsent';
import { COOKIE_CATEGORY_LABELS, FUNCTIONAL_CATEGORY_EMPTY_MESSAGE } from '@/lib/cookieInventory';

export type CookieModalTabId = 'necessary' | 'analytics' | 'functional' | 'marketing';

export type CookieModalTab = {
  id: CookieModalTabId;
  label: string;
  toggleCategory?: CookieCategory;
  locked?: boolean;
  shortDescription: string;
};

export const COOKIE_MODAL_TABS: CookieModalTab[] = [
  {
    id: 'necessary',
    label: 'Zorunlu Çerezler',
    locked: true,
    shortDescription:
      'Web sitesinin güvenli çalışması, çerez tercihlerinizin hatırlanması ve temel içerik ile görünüm hizmetleri için gereklidir. Bu kayıtlar kapatılamaz.',
  },
  {
    id: 'analytics',
    label: 'Analitik Çerezleri',
    toggleCategory: 'analytics',
    shortDescription:
      'Site trafiği ve sayfa kullanımını ölçerek hizmet kalitesini artırmamıza yardımcı olur. Yalnızca bu kategoriye izin verirseniz sunucu tarafı istatistik kaydı oluşturulur.',
  },
  {
    id: 'functional',
    label: 'Fonksiyonel Çerezler',
    toggleCategory: 'functional',
    shortDescription:
      'Tercihlerinizi hatırlayarak deneyimi kişiselleştirmek için kullanılabilir. Şu an bu sitede isteğe bağlı fonksiyonel çerez bulunmamaktadır.',
  },
  {
    id: 'marketing',
    label: 'Reklam / Pazarlama Çerezleri',
    toggleCategory: 'marketing',
    shortDescription:
      'Reklam performansı ve dönüşüm ölçümü (Meta Pixel) için kullanılır. Yalnızca açık onayınız halinde script yüklenir ve ilgili çerezler oluşturulabilir.',
  },
];

export const PAYTR_NOTE =
  'Satın alma sırasında PayTR ödeme altyapısı, ödeme güvenliği için kendi teknik çerezlerini kullanabilir. Bu çerezler yalnızca ödeme işlemi sırasında devreye girer.';

export { COOKIE_CATEGORY_LABELS, FUNCTIONAL_CATEGORY_EMPTY_MESSAGE };
