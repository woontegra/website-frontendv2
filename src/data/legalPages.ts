export type LegalPageKey =
  | 'gizlilik-politikasi'
  | 'cerez-politikasi'
  | 'kvkk-aydinlatma-metni'
  | 'kullanim-sartlari'
  | 'mesafeli-satis-sozlesmesi'
  | 'on-bilgilendirme-formu';

export type LegalPageDef = {
  path: `/${LegalPageKey}`;
  title: string;
  description: string;
  /** Backend /api/pages/slug — sırayla denenir; yetersizse detaylı fallback */
  apiSlugs: string[];
};

export const LEGAL_PAGES: LegalPageDef[] = [
  {
    path: '/gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    description:
      'Bilirkişi Hesap gizlilik politikası: kişisel verilerin toplanması, kullanımı, aktarımı ve korunması.',
    apiSlugs: ['gizlilik-politikasi'],
  },
  {
    path: '/cerez-politikasi',
    title: 'Çerez Politikası',
    description:
      'Zorunlu, analitik, pazarlama ve fonksiyonel çerezler; Meta Pixel yalnızca onay ile çalışır.',
    apiSlugs: ['cerez-politikasi'],
  },
  {
    path: '/kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    description: '6698 sayılı Kanun kapsamında veri sorumlusu aydınlatma metni.',
    apiSlugs: ['kvkk-aydinlatma-metni', 'kvkk-aydinlatma'],
  },
  {
    path: '/kullanim-sartlari',
    title: 'Kullanım Şartları',
    description: 'Platform kullanım koşulları, demo, abonelik ve sorumluluk sınırları.',
    apiSlugs: ['kullanim-sartlari', 'kullanim-kosullari'],
  },
  {
    path: '/mesafeli-satis-sozlesmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'Dijital yazılım aboneliği mesafeli satış sözleşmesi.',
    apiSlugs: ['mesafeli-satis-sozlesmesi'],
  },
  {
    path: '/on-bilgilendirme-formu',
    title: 'Ön Bilgilendirme Formu',
    description: 'Satın alma öncesi ön bilgilendirme — fiyat, ödeme, dijital ifa ve cayma hakkı.',
    apiSlugs: ['on-bilgilendirme-formu', 'on-bilgilendirme'],
  },
];

export const LEGAL_PAGE_BY_KEY = Object.fromEntries(
  LEGAL_PAGES.map((p) => [p.path.slice(1), p]),
) as Record<LegalPageKey, LegalPageDef>;

export const FOOTER_LEGAL_LINKS = LEGAL_PAGES.map((p) => ({
  to: p.path,
  label: p.title,
}));
