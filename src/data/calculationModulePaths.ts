/**
 * Public module URLs — website-frontend (eski site) ile aynı path yapısı.
 * Ana sayfa kartları, landing route'ları ve SEO bu path'leri kullanır.
 */
export const calculationModulePaths = {
  kidem: '/kidem-tazminati-hesaplama',
  ihbar: '/ihbar-tazminati-hesaplama',
  'fazla-mesai': '/fazla-mesai-hesaplama',
  'yillik-izin': '/yillik-izin-hesaplama',
  ubgt: '/ubgt-hesaplama',
  'hafta-tatili': '/hafta-tatili-hesaplama',
  ucret: '/ucret-alacagi-hesaplama',
  bakiye: '/bakiye-ucret-hesaplama',
  'kotu-niyet': '/kotu-niyet-tazminati',
  'ise-baslatmama': '/ise-baslatmama-tazminati',
  'bosta-gecen': '/bosta-gecen-sure-ucreti',
  ayrimcilik: '/ayrimcilik-tazminati',
  prim: '/prim-alacagi-hesaplama',
  'haksiz-fesih': '/haksiz-fesih-tazminati',
  sendikal: '/sendikal-tazminat',
} as const;

/** V2/CMS kısa slug → eski site canonical path */
const v2SlugToLegacyPath: Record<string, string> = {
  '/kidem-tazminati': calculationModulePaths.kidem,
  '/ihbar-tazminati': calculationModulePaths.ihbar,
  '/fazla-mesai': calculationModulePaths['fazla-mesai'],
  '/yillik-izin': calculationModulePaths['yillik-izin'],
  '/ubgt-alacagi': calculationModulePaths.ubgt,
  '/hafta-tatili-alacagi': calculationModulePaths['hafta-tatili'],
  '/ucret-alacagi': calculationModulePaths.ucret,
  '/bakiye-ucret-alacagi': calculationModulePaths.bakiye,
  '/prim-alacagi': calculationModulePaths.prim,
};

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

/** Modül kartı / landing için public path (API slug uyumu dahil). */
export function resolvePublicModulePath(slugOrPath: string): string {
  const normalized = normalizePath(slugOrPath);
  return v2SlugToLegacyPath[normalized] ?? normalized;
}

/** Eski V2 kısa URL'ler → canonical (301 benzeri client redirect). */
export const calculationModulePathRedirects: Array<{ from: string; to: string }> = [
  { from: 'kidem-tazminati', to: 'kidem-tazminati-hesaplama' },
  { from: 'ihbar-tazminati', to: 'ihbar-tazminati-hesaplama' },
  { from: 'fazla-mesai', to: 'fazla-mesai-hesaplama' },
  { from: 'yillik-izin', to: 'yillik-izin-hesaplama' },
  { from: 'ubgt-alacagi', to: 'ubgt-hesaplama' },
  { from: 'hafta-tatili-alacagi', to: 'hafta-tatili-hesaplama' },
  { from: 'ucret-alacagi', to: 'ucret-alacagi-hesaplama' },
  { from: 'bakiye-ucret-alacagi', to: 'bakiye-ucret-hesaplama' },
  { from: 'prim-alacagi', to: 'prim-alacagi-hesaplama' },
];

/** CMS medya anahtarları (module.{slug}.*) — kısa slug ile kayıtlı görseller */
export const moduleMediaSlugAliases: Record<string, string> = {
  'kidem-tazminati-hesaplama': 'kidem-tazminati',
  'ihbar-tazminati-hesaplama': 'ihbar-tazminati',
  'fazla-mesai-hesaplama': 'fazla-mesai',
  'yillik-izin-hesaplama': 'yillik-izin',
  'ubgt-hesaplama': 'ubgt-alacagi',
  'hafta-tatili-hesaplama': 'hafta-tatili-alacagi',
  'ucret-alacagi-hesaplama': 'ucret-alacagi',
  'bakiye-ucret-hesaplama': 'bakiye-ucret-alacagi',
  'prim-alacagi-hesaplama': 'prim-alacagi',
};
