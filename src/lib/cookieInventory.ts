/** Public site çerez / depolama envanteri — banner ve Çerez ve Benzeri Teknolojiler Politikası tek kaynağı. */

export type CookieInventoryCategory =
  | 'necessary'
  | 'payment_third_party'
  | 'analytics'
  | 'marketing'
  | 'functional';

export type CookieInventoryItem = {
  name: string;
  provider: string;
  type: string;
  category: CookieInventoryCategory;
  /** Çerez Politikası tablosundaki “Kategori” sütunu */
  legalCategory: string;
  purpose: string;
  retention: string;
  consentRequirement: string;
  notes?: string;
};

export const COOKIE_CATEGORY_LABELS: Record<
  Exclude<CookieInventoryCategory, 'functional'>,
  { title: string; description: string }
> = {
  necessary: {
    title: 'Zorunlu çerezler ve teknik hizmetler',
    description:
      'Sitenin güvenli çalışması, çerez tercihlerinizin hatırlanması ve temel içerik sunumu için gereklidir. Bu kayıtlar kapatılamaz.',
  },
  payment_third_party: {
    title: 'Ödeme ve üçüncü taraf hizmetleri',
    description:
      'Yalnızca ödeme işlemi sırasında, ödemenin güvenli tamamlanması için kullanılır. Satın al sayfasında PayTR ödeme penceresi açıldığında devreye girer.',
  },
  analytics: {
    title: 'Analitik çerezler',
    description:
      'Ziyaret edilen sayfalar ve teknik kullanım istatistikleri (sayfa yolu, yönlendiren, IP adresi, tarayıcı bilgisi) sunucu tarafında kaydedilir. Yalnızca bu kategoriye onay verirseniz etkinleşir.',
  },
  marketing: {
    title: 'Pazarlama çerezleri',
    description:
      'Reklam performansı ve dönüşüm ölçümü (Meta Pixel). Yalnızca bu kategoriye onay verirseniz script yüklenir ve ilgili çerezler oluşabilir.',
  },
};

export const FUNCTIONAL_CATEGORY_EMPTY_MESSAGE =
  'Bu sitede şu an isteğe bağlı fonksiyonel çerez kullanılmamaktadır.';

/** Public ziyaretçi envanteri — admin oturum kayıtları dahil değildir. */
export const PUBLIC_COOKIE_INVENTORY: CookieInventoryItem[] = [
  {
    name: 'cookieConsent',
    provider: 'Site',
    type: 'localStorage',
    category: 'necessary',
    legalCategory: 'Zorunlu',
    purpose: 'Çerez tercihlerinizi ve seçtiğiniz kategorileri saklamak',
    retention: '12 ay',
    consentRequirement: 'Zorunlu, kapatılamaz',
    notes: 'Süre dolduğunda banner yeniden gösterilir.',
  },
  {
    name: 'bh_site_branding_v1',
    provider: 'Site',
    type: 'sessionStorage',
    category: 'necessary',
    legalCategory: 'Zorunlu teknik performans',
    purpose:
      'Logo ve favicon bilgisini oturum boyunca önbelleğe alarak görsel sıçramayı azaltmak',
    retention: 'Oturum süresi',
    consentRequirement: 'Zorunlu, kapatılamaz',
  },
  {
    name: 'Cloudinary CDN',
    provider: 'Cloudinary',
    type: 'Ağ/CDN isteği',
    category: 'necessary',
    legalCategory: 'Zorunlu içerik hizmeti',
    purpose: 'CMS görsellerinin ve medya dosyalarının hızlı yüklenmesi',
    retention: 'Sağlayıcı politikasına bağlı',
    consentRequirement: 'Zorunlu teknik hizmet',
  },
  {
    name: 'Google Fonts',
    provider: 'Google',
    type: 'Ağ isteği',
    category: 'necessary',
    legalCategory: 'Zorunlu görünüm hizmeti',
    purpose: 'Site yazı tiplerinin düzgün gösterilmesi',
    retention: 'Google politikalarına bağlı',
    consentRequirement: 'Zorunlu teknik hizmet',
    notes: 'fonts.googleapis.com ve fonts.gstatic.com üzerinden yüklenir.',
  },
  {
    name: 'PayTR ödeme çerezleri',
    provider: 'PayTR',
    type: 'Üçüncü taraf cookie',
    category: 'payment_third_party',
    legalCategory: 'Ödeme / zorunlu işlem',
    purpose: 'Ödeme işleminin güvenli şekilde yürütülmesi',
    retention: 'PayTR politikasına bağlı',
    consentRequirement: 'Ödeme işlemi için gerekli',
    notes: 'Yalnızca /satin-al sayfasında ödeme iframe’i açıkken.',
  },
  {
    name: 'page_views',
    provider: 'Site',
    type: 'Sunucu taraflı kayıt',
    category: 'analytics',
    legalCategory: 'Analitik',
    purpose:
      'Sayfa yolu, yönlendiren sayfa, IP adresi ve tarayıcı bilgisi gibi teknik verilerle ziyaret istatistiği oluşturmak',
    retention: 'İşleme amacı ve şirket saklama politikasına göre',
    consentRequirement: 'Analitik onayı gerekir',
  },
  {
    name: 'Meta Pixel / fbevents.js',
    provider: 'Meta',
    type: 'Script + cookie',
    category: 'marketing',
    legalCategory: 'Pazarlama',
    purpose: 'Sayfa görüntüleme, reklam ölçümü ve dönüşüm takibi',
    retention: 'Oturum + Meta çerez süreleri',
    consentRequirement: 'Pazarlama onayı gerekir',
  },
  {
    name: '_fbp',
    provider: 'Meta',
    type: 'Cookie',
    category: 'marketing',
    legalCategory: 'Pazarlama',
    purpose: 'Reklam ölçümü ve ziyaretçi davranışlarının analiz edilmesi',
    retention: 'Yaklaşık 90 gün',
    consentRequirement: 'Pazarlama onayı gerekir',
  },
  {
    name: '_fbc',
    provider: 'Meta',
    type: 'Cookie',
    category: 'marketing',
    legalCategory: 'Pazarlama',
    purpose: 'Facebook reklam tıklaması ve kampanya eşleştirmesi',
    retention: 'Yaklaşık 90 gün',
    consentRequirement: 'Pazarlama onayı gerekir',
  },
];

export function getInventoryByCategory(
  category: CookieInventoryCategory,
): CookieInventoryItem[] {
  return PUBLIC_COOKIE_INVENTORY.filter((item) => item.category === category);
}

/** Politika sayfası HTML tablosu için sıralı bölümler. */
export const POLICY_INVENTORY_SECTIONS: {
  key: Exclude<CookieInventoryCategory, 'functional'>;
  title: string;
}[] = [
  { key: 'necessary', title: 'Zorunlu çerezler ve teknik hizmetler' },
  { key: 'payment_third_party', title: 'Ödeme ve üçüncü taraf hizmetleri' },
  { key: 'analytics', title: 'Analitik' },
  { key: 'marketing', title: 'Pazarlama' },
];
