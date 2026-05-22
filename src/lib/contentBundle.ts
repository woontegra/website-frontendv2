import {
  Calculator,
  Clock,
  Timer,
  CalendarDays,
  Flag,
  Sun,
  Wallet,
  Receipt,
  Ban,
  UserMinus,
  Hourglass,
  Users,
  Coins,
  Gavel,
  Landmark,
  Building2,
  Headphones,
  Wrench,
  Shield,
  LayoutGrid,
  Sparkles,
  Layers,
  FileCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { apiGet } from './apiClient';
import { config } from './config';
import {
  heroImageAltFromConfig,
  isStaleHeroPlaceholderPath,
  parseHeroSlidesFromConfig,
  type HeroSlideResolved,
} from './homepageHero';
import { resolvePublicAssetUrl } from './resolvePublicAssetUrl';
import {
  calculationPages,
  getCalculationPageByPath,
  type CalculationPageData,
} from '@/data/calculationPages';
import {
  parseLandingContent,
  type ModuleLandingContent,
} from '@/lib/calculationLandingContent';
import { calculationModules as staticModules } from '@/data/modules';
import {
  moduleMediaSlugAliases,
  resolvePublicModulePath,
} from '@/data/calculationModulePaths';
import { faqCategories as staticFaqCategories } from '@/data/faq';

const CONTENT_BUNDLE_PATH = '/api/v2/public/content-bundle';
const PUBLIC_SETTINGS_PATH = '/api/public/settings';
const FETCH_TIMEOUT_MS = 8000;

const DEFAULT_LOGO_URL = '/images/logo.png';
const DEFAULT_FAVICON_URL = '/images/favicon.png';

const supportIconByName: Record<string, LucideIcon> = {
  Building2,
  Headphones,
  Wrench,
};

const trustIconByName: Record<string, LucideIcon> = {
  Layers,
  FileCheck,
  ShieldCheck,
  Shield,
  LayoutGrid,
  Sparkles,
};

const iconByName: Record<string, LucideIcon> = {
  Calculator,
  Clock,
  Timer,
  CalendarDays,
  Flag,
  Sun,
  Wallet,
  Receipt,
  Ban,
  UserMinus,
  Hourglass,
  Users,
  Coins,
  Gavel,
  Landmark,
};

export type ModuleCardView = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type FaqItemView = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategoryView = {
  id: string;
  title: string;
  items: FaqItemView[];
};

export type FaqPreviewItemView = FaqItemView;

export type PricingPlanView = {
  code: string;
  name: string;
  priceDisplay: string;
  priceSuffix: string | null;
  subtitle: string | null;
  badgeText: string | null;
  isFeatured: boolean;
  features: string[];
  ctaText: string;
  ctaTo: string;
  ctaExternal: boolean;
  isBaro: boolean;
};

export type PricingComparisonVariant = 'negative' | 'primary' | 'positive';

export type PricingComparisonColumnView = {
  title: string;
  variant: PricingComparisonVariant;
  items: string[];
};

export type PricingFaqItemView = {
  id: string;
  question: string;
  answer: string;
};

export type CalculationLandingSeoView = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
};

export type PageContentView = {
  pageKey: string;
  sectionKey: string;
  title: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  description: string | null;
  body: Record<string, unknown> | null;
};

export type MediaAssetView = {
  id: string;
  assetKey: string;
  title: string | null;
  altText: string | null;
  fileUrl: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type SeoPageView = {
  path: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

export type CalculationLandingView = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  heroNote: string;
  benefits: string[];
  landingContent: ModuleLandingContent | null;
  processSteps: { title: string; description: string }[];
  ctaText: string;
  bottomCtaDescription: string;
  seo: CalculationLandingSeoView;
};

export type ContactSettingView = {
  contactEmail: string | null;
  contactPhone: string | null;
  phoneNote: string | null;
  contactAddress: string | null;
  panelLoginUrl: string | null;
};

export type SupportCardView = {
  id: string;
  title: string;
  description: string | null;
  icon: LucideIcon;
};

export type ContactView = {
  setting: ContactSettingView;
  supportCards: SupportCardView[];
};

export type DemoTrustItemView = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type DemoPageView = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroSubtitle: string;
  benefits: string[];
  audience: string[];
  processSteps: string[];
  trustItems: DemoTrustItemView[];
  bottomCtaTitle: string;
  bottomCtaDescription: string;
};

export type FooterLinkView = {
  title: string;
  href: string;
};

export type FooterView = {
  siteName: string;
  tagline: string;
  copyrightNote: string;
  navLinks: FooterLinkView[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
};

export type HomepageSectionView = {
  sectionKey: string;
  title: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  description: string | null;
  config: Record<string, unknown> | null;
  sortOrder: number;
};

export type SiteBrandingView = {
  logoUrl: string;
  faviconUrl: string;
};

export type TrustMetricView = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type HomepageTrustView = {
  headline: string;
  metrics: TrustMetricView[];
};

export type HomepageHeroView = {
  eyebrow: string;
  title: string;
  description: string;
};

export type HomepageSectionHeadingView = {
  eyebrow: string;
  title: string;
  description: string;
};

export type HomepageExcelView = HomepageSectionHeadingView & {
  benefits: string[];
  imageSrc: string;
  imageAlt: string;
};

export type HomepageCtaButtonView = {
  code: string;
  label: string;
  href: string;
  variant: string;
  sortOrder: number;
};

export type ContentBundleView = {
  modules: ModuleCardView[];
  calculationLandings: CalculationLandingView[];
  faqCategories: FaqCategoryView[];
  faqPreview: FaqPreviewItemView[];
  pricingPlans: PricingPlanView[];
  pricingComparisonTitle: string;
  pricingComparisonColumns: PricingComparisonColumnView[];
  pricingFaq: PricingFaqItemView[];
  contact: ContactView;
  demo: DemoPageView;
  footer: FooterView;
  seoByPath: Record<string, SeoPageView>;
  pageContentsByPath: Record<string, PageContentView[]>;
  mediaAssets: MediaAssetView[];
  mediaByKey: Record<string, MediaAssetView>;
  homepage: HomepageSectionView[];
  homepageByKey: Record<string, HomepageSectionView>;
  trustMetrics: TrustMetricView[];
  ctaButtons: HomepageCtaButtonView[];
  settings: Record<string, string | null>;
  branding: SiteBrandingView;
};

export type ContentBundleApi = {
  calculationModules: {
    id: number;
    code: string;
    cardTitle: string;
    cardDescription: string | null;
    slug: string;
    iconName: string | null;
    landingEyebrow: string | null;
    landingTitle: string | null;
    landingDescription: string | null;
    benefits: string[];
    landingContent?: unknown;
    processSteps: { title: string; description: string }[];
    ctaText: string | null;
    sortOrder: number;
  }[];
  faq: {
    categories: {
      code: string;
      title: string;
      sortOrder: number;
      items: { id: number; code: string; question: string; answer: string; sortOrder: number }[];
    }[];
  };
  pricing: {
    plans: {
      code: string;
      name: string;
      priceDisplay: string | null;
      priceSuffix: string | null;
      subtitle: string | null;
      badgeText: string | null;
      isFeatured: boolean;
      ctaText: string | null;
      ctaLink: string | null;
      features: { text: string }[];
    }[];
    comparisonColumns: {
      title: string;
      variant: string;
      items: string[];
      sortOrder: number;
    }[];
  };
  contact: {
    setting: ContactSettingView | null;
    supportCards: {
      id: number;
      title: string;
      description: string | null;
      iconName: string | null;
      sortOrder: number;
    }[];
  };
  settings: Record<string, string | null>;
  homepage?: {
    sectionKey: string;
    title?: string | null;
    eyebrow?: string | null;
    subtitle?: string | null;
    description?: string | null;
    config?: Record<string, unknown> | null;
    sortOrder?: number;
  }[];
  trustMetrics: {
    valueText: string;
    labelText: string;
    description: string | null;
    iconName: string | null;
  }[];
  seo: {
    path: string;
    title: string | null;
    description: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
  }[];
  pageContents?: {
    id?: number;
    pageKey: string;
    sectionKey: string;
    title?: string | null;
    eyebrow?: string | null;
    subtitle?: string | null;
    description?: string | null;
    bodyJson?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }[];
  pageCards?: {
    pageKey: string;
    cards: {
      id?: number;
      cardKey: string;
      title: string;
      description?: string | null;
      linkUrl?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }[];
  }[];
  mediaAssets?: {
    id: number | string;
    assetKey: string;
    title?: string | null;
    altText?: string | null;
    fileUrl?: string | null;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    sortOrder?: number;
  }[];
  ctaButtons?: {
    id?: number;
    code: string;
    label: string;
    linkUrl?: string | null;
    variant?: string | null;
    sortOrder?: number;
  }[];
};

const DEFAULT_MODULE_HERO_NOTE =
  'Bu sayfa tanıtım amaçlıdır. Hesaplama işlemi program içinde yapılır.';

const DEFAULT_MODULE_CTA_DESCRIPTION =
  'Ücretsiz demo ile modülü deneyin veya mevcut hesabınızla programa giriş yapın.';

function resolveIcon(name: string | null | undefined): LucideIcon {
  if (name && iconByName[name]) return iconByName[name];
  return Calculator;
}

function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function normalizeContentPath(path: string): string {
  const trimmed = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function parsePageBodyJson(bodyJson: string | null | undefined): Record<string, unknown> | null {
  if (!bodyJson) return null;
  try {
    const parsed = JSON.parse(bodyJson) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizePageContentPath(pageKey: string): string {
  return normalizeContentPath(pageKey.startsWith('/') ? pageKey : `/${pageKey}`);
}

function buildSeoByPath(seoPages: ContentBundleApi['seo'] | undefined): Record<string, SeoPageView> {
  const index: Record<string, SeoPageView> = {};
  for (const page of seoPages ?? []) {
    const path = normalizeContentPath(page.path);
    index[path] = {
      path,
      title: page.title,
      description: page.description,
      ogTitle: page.ogTitle ?? null,
      ogDescription: page.ogDescription ?? null,
      ogImage: page.ogImage ?? null,
    };
  }
  return index;
}

function normalizeMediaAssetKey(assetKey: string): string {
  return assetKey.trim();
}

function hasUsableMediaFileUrl(fileUrl: string | null | undefined): fileUrl is string {
  return typeof fileUrl === 'string' && fileUrl.trim().length > 0;
}

function mapApiMediaAsset(
  row: NonNullable<ContentBundleApi['mediaAssets']>[number],
): MediaAssetView | null {
  const assetKey = normalizeMediaAssetKey(row.assetKey ?? '');
  if (!assetKey || !hasUsableMediaFileUrl(row.fileUrl)) {
    return null;
  }

  return {
    id: String(row.id),
    assetKey,
    title: row.title?.trim() || null,
    altText: row.altText?.trim() || null,
    fileUrl: row.fileUrl.trim(),
    mimeType: row.mimeType?.trim() || null,
    width: typeof row.width === 'number' ? row.width : null,
    height: typeof row.height === 'number' ? row.height : null,
    sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
  };
}

function mapApiMediaAssets(
  rows: ContentBundleApi['mediaAssets'] | undefined,
): MediaAssetView[] {
  return (rows ?? [])
    .map(mapApiMediaAsset)
    .filter((asset): asset is MediaAssetView => asset !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.assetKey.localeCompare(b.assetKey));
}

export function buildMediaByKey(assets: MediaAssetView[]): Record<string, MediaAssetView> {
  const index: Record<string, MediaAssetView> = {};
  for (const asset of assets) {
    if (!index[asset.assetKey]) {
      index[asset.assetKey] = asset;
    }
  }
  return index;
}

export function getMediaAssetByKey(
  content: ContentBundleView,
  assetKey: string,
): MediaAssetView | undefined {
  const key = normalizeMediaAssetKey(assetKey);
  if (!key) return undefined;
  const asset = content.mediaByKey[key];
  return asset && hasUsableMediaFileUrl(asset.fileUrl) ? asset : undefined;
}

function findMediaAssetByFileUrl(
  content: ContentBundleView,
  url: string,
): MediaAssetView | undefined {
  const needle = url.trim();
  if (!needle) return undefined;
  return content.mediaAssets.find((a) => a.fileUrl?.trim() === needle);
}

/** Config veya medya URL’sini canlı sitede kullanılabilir src’ye çevirir. */
export function resolveConfigImageUrl(
  content: ContentBundleView,
  configUrl: string | null | undefined,
  fallbackUrl: string,
): string {
  const raw = configUrl?.trim();
  if (!raw) return resolvePublicAssetUrl(fallbackUrl);
  const byKey = getMediaAssetByKey(content, raw);
  if (byKey?.fileUrl) return resolvePublicAssetUrl(byKey.fileUrl);
  const matched = findMediaAssetByFileUrl(content, raw);
  if (matched?.fileUrl) return resolvePublicAssetUrl(matched.fileUrl);
  return resolvePublicAssetUrl(raw);
}

export function getHomepageSection(
  content: ContentBundleView,
  sectionKey: string,
): HomepageSectionView | undefined {
  return content.homepageByKey[sectionKey];
}

/** Ana sayfa hero — önce yayınlanmış homepage config (heroImage), sonra medya anahtarı. */
export function resolveHomepageHeroImage(
  content: ContentBundleView,
  fallbackUrl: string,
): string {
  const slides = resolveHomepageHeroSlides(content, fallbackUrl, '');
  return slides[0]?.src ?? resolveConfigImageUrl(content, null, fallbackUrl);
}

export function resolveHomepageHeroAlt(content: ContentBundleView, fallback: string): string {
  const cfg = getHomepageSection(content, 'hero')?.config;
  const fromCfg = heroImageAltFromConfig(cfg ?? null, '');
  if (fromCfg) return fromCfg;
  const asset = getMediaAssetByKey(content, 'home.hero.image');
  return asset?.altText?.trim() || fallback;
}

/** Ana sayfa hero carousel slaytları. */
export function resolveHomepageHeroSlides(
  content: ContentBundleView,
  fallbackUrl: string,
  fallbackAlt: string,
): HeroSlideResolved[] {
  const hero = getHomepageSection(content, 'hero');
  const cfg = hero?.config ?? null;
  const defaultAlt = heroImageAltFromConfig(cfg, fallbackAlt);
  let inputs = parseHeroSlidesFromConfig(cfg);

  if (inputs.length === 0) {
    const asset = getMediaAssetByKey(content, 'home.hero.image');
    if (asset?.fileUrl?.trim()) {
      inputs = [{ url: asset.fileUrl.trim() }];
    }
  }

  const seen = new Set<string>();
  const resolved: HeroSlideResolved[] = [];
  for (const slide of inputs) {
    const src = resolveConfigImageUrl(content, slide.url, fallbackUrl).trim();
    if (!src || isStaleHeroPlaceholderPath(src) || seen.has(src)) continue;
    seen.add(src);
    resolved.push({
      src,
      alt: slide.alt?.trim() || defaultAlt,
    });
  }

  if (resolved.length > 0) return resolved;

  return [
    {
      src: resolveConfigImageUrl(content, null, fallbackUrl),
      alt: defaultAlt,
    },
  ];
}

const DEFAULT_HERO_EYEBROW =
  'Avukatlar ve bilirkişiler için profesyonel hesaplama yazılımı';
const DEFAULT_HERO_TITLE =
  'İşçilik alacaklarında doğru, hızlı ve denetlenebilir hesaplama';
const DEFAULT_HERO_DESCRIPTION =
  'Kıdem, ihbar, fazla mesai ve 40+ modül — Excel karmaşası olmadan mevzuata uygun sonuç ve standart rapor çıktısı.';

/** Ana sayfa hero metinleri — v2_homepage_sections (sectionKey: hero). */
export function resolveHomepageHero(content: ContentBundleView): HomepageHeroView {
  const hero = getHomepageSection(content, 'hero');
  return {
    eyebrow: hero?.eyebrow?.trim() || DEFAULT_HERO_EYEBROW,
    title: hero?.title?.trim() || DEFAULT_HERO_TITLE,
    description: hero?.description?.trim() || DEFAULT_HERO_DESCRIPTION,
  };
}

const DEFAULT_MODULES_TITLE = 'Hesaplama Modülleri';
const DEFAULT_MODULES_DESCRIPTION =
  "Kıdemden fazla mesaiye, yıllık izinden UBGT'ye kadar işçilik alacaklarını tek panelde hesaplayın.";

const DEFAULT_EXCEL_EYEBROW = 'Excel yerine program';
const DEFAULT_EXCEL_TITLE = 'Tablolarla uğraşmayın, dosyaya odaklanın';
const DEFAULT_EXCEL_DESCRIPTION =
  'Excel dosyaları her güncellemede risk taşır. Bilirkişi Hesap ile hesaplamalar merkezi, denetlenebilir ve profesyonel kalır.';
const DEFAULT_EXCEL_BENEFITS = [
  'Formül ve sürüm hatalarına son',
  'Standart rapor ve çıktı formatı',
  'Dosya kaybı riskini azaltma',
  'Ekip içi tutarlı hesaplama',
];
const DEFAULT_EXCEL_IMAGE_ALT = 'Excel yerine program kullanımı karşılaştırması';

const DEFAULT_PRICING_CTA_EYEBROW = 'Fiyatlandırma';
const DEFAULT_PRICING_CTA_TITLE = 'Dosyanız için doğru hesaplama altyapısını seçin';
const DEFAULT_PRICING_CTA_DESCRIPTION =
  'Profesyonel aylık veya yıllık paketler; baro üyelerine özel kampanyalar.';

const DEFAULT_FAQ_PREVIEW_EYEBROW = 'SSS';
const DEFAULT_FAQ_PREVIEW_TITLE = 'Sık sorulan sorular';
const DEFAULT_FAQ_PREVIEW_DESCRIPTION =
  'Merak ettiklerinizin özeti. Tüm yanıtlar SSS sayfasında.';

const STATIC_HERO_CTA_BUTTONS: HomepageCtaButtonView[] = [
  { code: 'hero_demo', label: 'Demo Talep Et', href: '/demo-talep', variant: 'accent', sortOrder: 1 },
  { code: 'hero_pricing', label: 'Abone Ol', href: '/fiyatlandirma', variant: 'outlineLight', sortOrder: 2 },
  {
    code: 'hero_login',
    label: 'Programa Giriş',
    href: config.PANEL_LOGIN_URL,
    variant: 'ghostLight',
    sortOrder: 3,
  },
];

const STATIC_PRICING_CTA_BUTTONS: HomepageCtaButtonView[] = [
  {
    code: 'pricing_go',
    label: 'Fiyatlandırmaya Git',
    href: '/fiyatlandirma',
    variant: 'accent',
    sortOrder: 1,
  },
  { code: 'pricing_demo', label: 'Demo Talep Et', href: '/demo-talep', variant: 'outlineLight', sortOrder: 2 },
];

function sectionHeading(
  content: ContentBundleView,
  sectionKey: string,
  defaults: HomepageSectionHeadingView,
): HomepageSectionHeadingView {
  const section = getHomepageSection(content, sectionKey);
  return {
    eyebrow: section?.eyebrow?.trim() || defaults.eyebrow,
    title: section?.title?.trim() || defaults.title,
    description: section?.description?.trim() || defaults.description,
  };
}

/** Modül vitrini başlık/açıklama — sectionKey: modules. */
export function resolveHomepageModulesHeading(
  content: ContentBundleView,
): HomepageSectionHeadingView {
  return sectionHeading(content, 'modules', {
    eyebrow: '',
    title: DEFAULT_MODULES_TITLE,
    description: DEFAULT_MODULES_DESCRIPTION,
  });
}

/** Excel karşılaştırma — sectionKey: excel + config.benefits / config.image. */
export function resolveHomepageExcel(
  content: ContentBundleView,
  imageFallback: string,
): HomepageExcelView {
  const excel = getHomepageSection(content, 'excel');
  const heading = sectionHeading(content, 'excel', {
    eyebrow: DEFAULT_EXCEL_EYEBROW,
    title: DEFAULT_EXCEL_TITLE,
    description: DEFAULT_EXCEL_DESCRIPTION,
  });
  const cfg = excel?.config ?? null;
  const benefitsRaw = Array.isArray(cfg?.benefits) ? (cfg.benefits as string[]) : [];
  const benefits = benefitsRaw.map((b) => String(b).trim()).filter(Boolean);
  return {
    ...heading,
    benefits: benefits.length > 0 ? benefits : DEFAULT_EXCEL_BENEFITS,
    imageSrc: resolveHomepageExcelImage(content, imageFallback),
    imageAlt:
      (typeof cfg?.imageAlt === 'string' && cfg.imageAlt.trim()) ||
      DEFAULT_EXCEL_IMAGE_ALT,
  };
}

/** Alt CTA — sectionKey: pricing_cta. */
export function resolveHomepagePricingCta(content: ContentBundleView): HomepageSectionHeadingView {
  return sectionHeading(content, 'pricing_cta', {
    eyebrow: DEFAULT_PRICING_CTA_EYEBROW,
    title: DEFAULT_PRICING_CTA_TITLE,
    description: DEFAULT_PRICING_CTA_DESCRIPTION,
  });
}

/** SSS önizleme başlıkları — sectionKey: faq_preview (sorular faq kategorilerinden). */
export function resolveHomepageFaqPreviewHeading(
  content: ContentBundleView,
): HomepageSectionHeadingView {
  return sectionHeading(content, 'faq_preview', {
    eyebrow: DEFAULT_FAQ_PREVIEW_EYEBROW,
    title: DEFAULT_FAQ_PREVIEW_TITLE,
    description: DEFAULT_FAQ_PREVIEW_DESCRIPTION,
  });
}

function mapApiCtaButtons(
  rows: ContentBundleApi['ctaButtons'] | undefined,
): HomepageCtaButtonView[] {
  return (rows ?? [])
    .map((row) => {
      const code = row.code?.trim() ?? '';
      const label = row.label?.trim() ?? '';
      const href = row.linkUrl?.trim() ?? '';
      if (!code || !label || !href) return null;
      return {
        code,
        label,
        href,
        variant: row.variant?.trim() || 'primary',
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is HomepageCtaButtonView => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getStaticCtaButtons(): HomepageCtaButtonView[] {
  return [...STATIC_HERO_CTA_BUTTONS, ...STATIC_PRICING_CTA_BUTTONS];
}

/** Hero CTA — v2_cta_buttons (code: hero_*). */
export function resolveHomepageHeroCtaButtons(
  content: ContentBundleView,
): HomepageCtaButtonView[] {
  const fromApi = content.ctaButtons.filter((b) => b.code.toLowerCase().startsWith('hero_'));
  return fromApi.length > 0 ? fromApi : STATIC_HERO_CTA_BUTTONS;
}

/** Alt CTA butonları — hero_* dışındaki yayınlanmış butonlar. */
export function resolveHomepagePricingCtaButtons(
  content: ContentBundleView,
): HomepageCtaButtonView[] {
  const fromApi = content.ctaButtons.filter((b) => !b.code.toLowerCase().startsWith('hero_'));
  return fromApi.length > 0 ? fromApi : STATIC_PRICING_CTA_BUTTONS;
}

/** Ana sayfa excel bölümü görseli. */
export function resolveHomepageExcelImage(
  content: ContentBundleView,
  fallbackUrl: string,
): string {
  const excel = getHomepageSection(content, 'excel');
  const fromConfig =
    typeof excel?.config?.image === 'string' ? (excel.config.image as string) : null;
  if (fromConfig) return resolveConfigImageUrl(content, fromConfig, fallbackUrl);
  return resolveMediaFileUrl(content, 'home.modules.image', fallbackUrl);
}

/** CMS görseli yoksa veya fileUrl boşsa fallbackUrl döner (statik görseller korunur). */
export function resolveMediaFileUrl(
  content: ContentBundleView,
  assetKey: string,
  fallbackUrl: string,
): string {
  const asset = getMediaAssetByKey(content, assetKey);
  if (asset?.fileUrl) return resolvePublicAssetUrl(asset.fileUrl);
  return resolvePublicAssetUrl(fallbackUrl);
}

function mapApiHomepageSections(
  rows: ContentBundleApi['homepage'] | undefined,
): HomepageSectionView[] {
  return (rows ?? [])
    .map((row) => {
      if (!row?.sectionKey) return null;
      let config: Record<string, unknown> | null = null;
      if (row.config && typeof row.config === 'object') {
        config = row.config as Record<string, unknown>;
      }
      return {
        sectionKey: row.sectionKey,
        title: row.title ?? null,
        eyebrow: row.eyebrow ?? null,
        subtitle: row.subtitle ?? null,
        description: row.description ?? null,
        config,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is HomepageSectionView => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.sectionKey.localeCompare(b.sectionKey));
}

function buildHomepageByKey(
  sections: HomepageSectionView[],
): Record<string, HomepageSectionView> {
  const index: Record<string, HomepageSectionView> = {};
  for (const section of sections) {
    index[section.sectionKey] = section;
  }
  return index;
}

function pickSettingValue(
  settings: Record<string, string | null>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = settings[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function mapSiteBranding(
  settings: Record<string, string | null>,
  publicBranding?: Partial<SiteBrandingView>,
): SiteBrandingView {
  const logoRaw =
    publicBranding?.logoUrl?.trim() ||
    pickSettingValue(settings, ['site.logo_url', 'logo_url', 'logoUrl']) ||
    DEFAULT_LOGO_URL;
  const faviconRaw =
    publicBranding?.faviconUrl?.trim() ||
    pickSettingValue(settings, ['site.favicon_url', 'favicon_url', 'faviconUrl']) ||
    DEFAULT_FAVICON_URL;
  return {
    logoUrl: resolvePublicAssetUrl(logoRaw),
    faviconUrl: resolvePublicAssetUrl(faviconRaw),
  };
}

export async function fetchPublicSiteBranding(): Promise<SiteBrandingView> {
  try {
    const json = await apiGet<{
      success?: boolean;
      data?: { logoUrl?: string; faviconUrl?: string };
    }>(PUBLIC_SETTINGS_PATH);
    const data = json.data;
    return mapSiteBranding({}, {
      logoUrl: data?.logoUrl,
      faviconUrl: data?.faviconUrl,
    });
  } catch {
    return mapSiteBranding({}, {});
  }
}

export type ModuleMediaSlot = 'hero' | 'features' | 'cta';

export function toModuleMediaSlug(slugOrPath: string): string {
  return normalizeContentPath(slugOrPath).replace(/^\//, '');
}

export function moduleMediaAssetKey(slugOrPath: string, slot: ModuleMediaSlot): string {
  return `module.${toModuleMediaSlug(slugOrPath)}.${slot}.image`;
}

export function getModuleMediaAsset(
  content: ContentBundleView,
  slugOrPath: string,
  slot: ModuleMediaSlot,
): MediaAssetView | undefined {
  return getMediaAssetByKey(content, moduleMediaAssetKey(slugOrPath, slot));
}

export function resolveModuleMediaFileUrl(
  content: ContentBundleView,
  slugOrPath: string,
  slot: ModuleMediaSlot,
  fallbackUrl = '',
): string {
  const primaryKey = moduleMediaAssetKey(slugOrPath, slot);
  const primary = resolveMediaFileUrl(content, primaryKey, '');
  if (primary) return primary;

  const mediaSlug = toModuleMediaSlug(slugOrPath);
  const legacyMediaSlug = moduleMediaSlugAliases[mediaSlug];
  if (legacyMediaSlug) {
    const legacyKey = `module.${legacyMediaSlug}.${slot}.image`;
    const legacy = resolveMediaFileUrl(content, legacyKey, '');
    if (legacy) return legacy;
  }

  return fallbackUrl;
}

function buildPageContentsByPath(
  rows: ContentBundleApi['pageContents'] | undefined,
): Record<string, PageContentView[]> {
  const index: Record<string, PageContentView[]> = {};
  for (const row of rows ?? []) {
    const path = normalizePageContentPath(row.pageKey);
    const entry: PageContentView = {
      pageKey: path,
      sectionKey: row.sectionKey,
      title: row.title ?? null,
      eyebrow: row.eyebrow ?? null,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      body: parsePageBodyJson(row.bodyJson),
    };
    if (!index[path]) index[path] = [];
    index[path].push(entry);
  }
  return index;
}

function getPageContentSection(
  index: Record<string, PageContentView[]>,
  path: string,
  sectionKey: string,
): PageContentView | undefined {
  return index[path]?.find((row) => row.sectionKey === sectionKey);
}

function buildLandingSeo(
  path: string,
  landing: CalculationLandingView,
  seoByPath: Record<string, SeoPageView>,
): CalculationLandingSeoView {
  const seo = seoByPath[path];
  return {
    metaTitle: seo?.title ?? landing.title,
    metaDescription: seo?.description ?? landing.description,
    ogTitle: seo?.ogTitle ?? seo?.title ?? landing.title,
    ogDescription: seo?.ogDescription ?? seo?.description ?? landing.description,
  };
}

function enrichCalculationLanding(
  landing: CalculationLandingView,
  path: string,
  content: ContentBundleView,
): CalculationLandingView {
  const seo = content.seoByPath[path];
  const hero = getPageContentSection(content.pageContentsByPath, path, 'hero');
  const cta = getPageContentSection(content.pageContentsByPath, path, 'cta');
  const ctaBodyText =
    (typeof cta?.body?.bottomCtaDescription === 'string' && cta.body.bottomCtaDescription) ||
    (typeof cta?.body?.ctaDescription === 'string' && cta.body.ctaDescription) ||
    null;
  const ctaTitleText =
    (typeof cta?.body?.ctaText === 'string' && cta.body.ctaText) || null;

  const enriched: CalculationLandingView = {
    ...landing,
    eyebrow: hero?.eyebrow?.trim() || landing.eyebrow,
    title: hero?.title?.trim() || landing.title,
    description:
      hero?.description?.trim() ||
      seo?.description?.trim() ||
      landing.description,
    heroNote: hero?.subtitle?.trim() || DEFAULT_MODULE_HERO_NOTE,
    ctaText: ctaTitleText || cta?.title?.trim() || landing.ctaText,
    bottomCtaDescription:
      ctaBodyText || cta?.description?.trim() || DEFAULT_MODULE_CTA_DESCRIPTION,
    seo: buildLandingSeo(path, landing, content.seoByPath),
  };

  enriched.seo = buildLandingSeo(path, enriched, content.seoByPath);
  return enriched;
}

function mapStaticCalculationPage(page: CalculationPageData): CalculationLandingView {
  const base: CalculationLandingView = {
    slug: page.slug,
    title: page.title,
    eyebrow: page.eyebrow,
    description: page.description,
    heroNote: DEFAULT_MODULE_HERO_NOTE,
    benefits: page.benefits,
    landingContent: null,
    processSteps: page.processSteps,
    ctaText: page.ctaText,
    bottomCtaDescription: DEFAULT_MODULE_CTA_DESCRIPTION,
    seo: {
      metaTitle: page.title,
      metaDescription: page.description,
      ogTitle: page.title,
      ogDescription: page.description,
    },
  };
  return base;
}

function mapApiModuleToLanding(
  module: ContentBundleApi['calculationModules'][number],
): CalculationLandingView {
  const slug = resolvePublicModulePath(normalizeContentPath(module.slug));
  const title = module.landingTitle ?? module.cardTitle;
  const description = module.landingDescription ?? module.cardDescription ?? '';
  return {
    slug,
    title,
    eyebrow: module.landingEyebrow ?? '',
    description,
    heroNote: DEFAULT_MODULE_HERO_NOTE,
    benefits: module.benefits?.length ? module.benefits : [],
    landingContent: parseLandingContent(module.landingContent),
    processSteps: module.processSteps?.length ? module.processSteps : [],
    ctaText:
      module.ctaText ?? `${title.replace(' Hesaplama', '')} için demo hesabı açın`,
    bottomCtaDescription: DEFAULT_MODULE_CTA_DESCRIPTION,
    seo: {
      metaTitle: title,
      metaDescription: description,
      ogTitle: title,
      ogDescription: description,
    },
  };
}

function hasUsableLanding(landing: CalculationLandingView): boolean {
  return Boolean(landing.title && (landing.benefits.length > 0 || landing.description));
}

/** API/CMS kısa kart metni gelse bile statik tam içerikle tamamla */
function mergeLandingWithStatic(
  landing: CalculationLandingView,
  staticPage: CalculationPageData,
): CalculationLandingView {
  const description =
    landing.description.trim().length >= 120
      ? landing.description
      : staticPage.description || landing.description;

  return {
    ...landing,
    title: landing.title || staticPage.title,
    eyebrow: landing.eyebrow?.trim() || staticPage.eyebrow,
    description,
    benefits: landing.benefits.length >= 3 ? landing.benefits : staticPage.benefits,
    processSteps:
      landing.processSteps.length >= 3 ? landing.processSteps : staticPage.processSteps,
    ctaText: landing.ctaText?.trim() || staticPage.ctaText,
  };
}

export function resolveCalculationLanding(
  pathname: string,
  content: ContentBundleView,
): CalculationLandingView | undefined {
  const path = resolvePublicModulePath(pathname);
  const staticPage = getCalculationPageByPath(path) ?? getCalculationPageByPath(pathname);
  const fromBundle = content.calculationLandings.find(
    (landing) => resolvePublicModulePath(landing.slug) === path,
  );

  let landing: CalculationLandingView | undefined;

  if (fromBundle && hasUsableLanding(fromBundle)) {
    landing = { ...fromBundle };
  } else if (staticPage) {
    landing = mapStaticCalculationPage(staticPage);
  } else if (fromBundle) {
    landing = { ...fromBundle };
  }

  if (!landing) {
    return undefined;
  }

  if (staticPage) {
    landing = mergeLandingWithStatic(landing, staticPage);
  }

  return enrichCalculationLanding(landing, path, content);
}

function buildFaqPreview(categories: FaqCategoryView[]): FaqPreviewItemView[] {
  return categories.flatMap((cat) => cat.items).slice(0, 3);
}

function mapStaticFaqCategories(): FaqCategoryView[] {
  return staticFaqCategories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    items: cat.items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  }));
}

function mapApiFaqCategories(
  categories: ContentBundleApi['faq']['categories'],
): FaqCategoryView[] {
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => ({
      id: cat.code,
      title: cat.title,
      items: [...cat.items]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.code,
          question: item.question,
          answer: item.answer,
        })),
    }));
}

function resolveSupportIcon(name: string | null | undefined): LucideIcon {
  if (name && supportIconByName[name]) return supportIconByName[name];
  return Headphones;
}

function getStaticDemoPage(): DemoPageView {
  return {
    heroEyebrow: 'Ücretsiz inceleme',
    heroTitle: 'Bilirkişi Hesap demo talebi',
    heroDescription:
      'Programı incelemek ve hesaplama modüllerini değerlendirmek için demo talebi oluşturun.',
    heroSubtitle:
      'Avukatlar, bilirkişiler ve hukuk profesyonelleri için geliştirilmiş işçilik alacakları hesaplama yazılımı.',
    benefits: [
      'Hesaplama modüllerini inceleme',
      'Rapor ekranlarını görme',
      'Kullanım akışını değerlendirme',
      'Fiyatlandırma ve abonelik seçeneklerini öğrenme',
    ],
    audience: ['Avukatlar', 'Bilirkişiler', 'Arabulucular', 'Hukuk büroları'],
    processSteps: [
      'Talebiniz alınır',
      'Bilgilendirme yapılır',
      'Uygun paket belirlenir',
      'Abonelik süreci başlatılabilir',
    ],
    trustItems: [
      {
        icon: Shield,
        title: 'Güvenilir hesaplama altyapısı',
        description: 'Mevzuata uygun parametrelerle denetlenebilir sonuçlar.',
      },
      {
        icon: LayoutGrid,
        title: 'İşçilik alacaklarına özel modüller',
        description: 'Kıdemden fazla mesaiye 40+ hesaplama modülü.',
      },
      {
        icon: Sparkles,
        title: 'Profesyonel kullanım için sade arayüz',
        description: 'Dosya odaklı, hızlı ve anlaşılır ekranlar.',
      },
    ],
    bottomCtaTitle: 'Önce fiyatları incelemek ister misiniz?',
    bottomCtaDescription:
      'Paketleri karşılaştırın; demo sonrası size uygun planı birlikte belirleyebilirsiniz.',
  };
}

function resolveTrustIcon(name: string | null | undefined): LucideIcon {
  if (name && trustIconByName[name]) return trustIconByName[name];
  return Layers;
}

function resolveDemoTrustIcon(name: string | null | undefined): LucideIcon {
  return resolveTrustIcon(name);
}

const DEFAULT_TRUST_HEADLINE =
  'İşçilik alacaklarında doğru, hızlı ve denetlenebilir hesaplama';

function getStaticTrustMetrics(): TrustMetricView[] {
  return [
    {
      icon: Layers,
      value: '40+',
      label: 'hesaplama modülü',
      description: 'Kıdemden UBGT’ye tüm işçilik alacakları tek platformda.',
    },
    {
      icon: FileCheck,
      value: 'Dakikalar',
      label: 'içinde rapor',
      description: 'Manuel tablolar yerine hızlı, standart çıktı üretin.',
    },
    {
      icon: ShieldCheck,
      value: 'Mevzuata',
      label: 'uygun yapı',
      description: 'Güncel parametrelerle denetlenebilir hesaplama süreci.',
    },
  ];
}

function mapApiTrustMetrics(
  rows: ContentBundleApi['trustMetrics'] | undefined,
): TrustMetricView[] {
  return (rows ?? [])
    .map((row) => ({
      value: row.valueText?.trim() ?? '',
      label: row.labelText?.trim() ?? '',
      description: row.description?.trim() ?? '',
      icon: resolveTrustIcon(row.iconName),
    }))
    .filter((row) => row.value.length > 0 || row.label.length > 0);
}

/** Ana sayfa güven metrikleri — API + homepage trust başlığı. */
export function resolveHomepageTrust(content: ContentBundleView): HomepageTrustView {
  const trustSection = getHomepageSection(content, 'trust');
  const headline = trustSection?.title?.trim() || DEFAULT_TRUST_HEADLINE;
  const metrics =
    content.trustMetrics.length > 0 ? content.trustMetrics : getStaticTrustMetrics();
  return { headline, metrics };
}

function mapApiDemoPage(api: ContentBundleApi): DemoPageView {
  const fallback = getStaticDemoPage();
  const siteName = api.settings?.site_name ?? config.siteName;
  const seoDemo = api.seo?.find((p) => normalizeContentPath(p.path) === '/demo-talep');
  const faqGenel = api.faq.categories.find((c) => c.code === 'genel');
  const faqDemo = api.faq.categories.find((c) => c.code === 'demo');

  const heroTitle = siteName ? `${siteName} demo talebi` : fallback.heroTitle;

  const heroDescription =
    seoDemo?.description?.trim() ||
    faqDemo?.items[0]?.answer?.trim() ||
    fallback.heroDescription;

  const heroSubtitle = faqGenel?.items[0]?.answer?.trim() || fallback.heroSubtitle;

  const processSteps =
    faqDemo?.items.length && faqDemo.items.length >= 2
      ? faqDemo.items.map((item) => item.question.replace(/\?$/, ''))
      : fallback.processSteps;

  const trustItems =
    api.trustMetrics?.length > 0
      ? api.trustMetrics.map((metric) => ({
          icon: resolveDemoTrustIcon(metric.iconName),
          title: `${metric.valueText} ${metric.labelText}`.trim(),
          description: metric.description ?? '',
        }))
      : fallback.trustItems;

  return {
    heroEyebrow: fallback.heroEyebrow,
    heroTitle,
    heroDescription,
    heroSubtitle,
    benefits: fallback.benefits,
    audience: fallback.audience,
    processSteps,
    trustItems,
    bottomCtaTitle: fallback.bottomCtaTitle,
    bottomCtaDescription: fallback.bottomCtaDescription,
  };
}

function getStaticContact(): ContactView {
  return {
    setting: {
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
      phoneNote: 'Yakında eklenecek',
      contactAddress: config.contactAddress,
      panelLoginUrl: config.PANEL_LOGIN_URL,
    },
    supportCards: [
      {
        id: 'baro',
        title: 'Baro kampanyaları için iletişim',
        description: 'Baroya özel indirim ve kampanya linkleri hakkında bilgi alın.',
        icon: Building2,
      },
      {
        id: 'demo',
        title: 'Demo ve abonelik desteği',
        description: 'Demo talebi, paket seçimi ve abonelik süreci için destek.',
        icon: Headphones,
      },
      {
        id: 'teknik',
        title: 'Teknik kullanım desteği',
        description: 'Program kullanımı ve hesaplama modülleri hakkında yönlendirme.',
        icon: Wrench,
      },
    ],
  };
}

function mapApiContact(contact: ContentBundleApi['contact']): ContactView {
  const fallback = getStaticContact();
  const setting = contact.setting
    ? {
        contactEmail: contact.setting.contactEmail ?? fallback.setting.contactEmail,
        contactPhone: contact.setting.contactPhone ?? fallback.setting.contactPhone,
        phoneNote: contact.setting.phoneNote ?? fallback.setting.phoneNote,
        contactAddress: contact.setting.contactAddress ?? fallback.setting.contactAddress,
        panelLoginUrl: contact.setting.panelLoginUrl ?? fallback.setting.panelLoginUrl,
      }
    : fallback.setting;

  const supportCards =
    contact.supportCards.length > 0
      ? [...contact.supportCards]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((card) => ({
            id: String(card.id),
            title: card.title,
            description: card.description,
            icon: resolveSupportIcon(card.iconName),
          }))
      : fallback.supportCards;

  return { setting, supportCards };
}

const PRICING_COMPARISON_TITLE =
  'Excel ile uğraşmak yerine hesaplamaları tek panelde yönetin';

function normalizeComparisonVariant(variant: string): PricingComparisonVariant {
  if (variant === 'negative' || variant === 'primary' || variant === 'positive') {
    return variant;
  }
  return 'positive';
}

function getStaticPricingPlans(): PricingPlanView[] {
  return [
    {
      code: 'monthly',
      name: 'Profesyonel Aylık',
      priceDisplay: '2.000 TL',
      priceSuffix: '/ ay',
      subtitle: 'Tüm hesaplama modüllerine aylık erişim.',
      badgeText: null,
      isFeatured: false,
      features: [
        '40+ hesaplama modülü',
        'Kıdem, ihbar, fazla mesai, yıllık izin, UBGT',
        'Rapor ve çıktı desteği',
        'Güncel parametrelerle hesaplama',
        'Teknik destek',
      ],
      ctaText: 'Aylık Abone Ol',
      ctaTo: config.PAYMENT_MONTHLY_URL,
      ctaExternal: true,
      isBaro: false,
    },
    {
      code: 'yearly',
      name: 'Profesyonel Yıllık',
      priceDisplay: '20.000 TL',
      priceSuffix: '/ yıl',
      subtitle: 'Yıllık kullanım için daha avantajlı profesyonel paket.',
      badgeText: 'En avantajlı',
      isFeatured: true,
      features: [
        'Tüm profesyonel modüller',
        '12 ay erişim',
        'Rapor ve çıktı desteği',
        'Güncel parametrelerle hesaplama',
        'Öncelikli destek',
      ],
      ctaText: 'Yıllık Abone Ol',
      ctaTo: config.PAYMENT_YEARLY_URL,
      ctaExternal: true,
      isBaro: false,
    },
    {
      code: 'baro',
      name: 'Baro Üyelerine Özel',
      priceDisplay: '%40 indirimli',
      priceSuffix: null,
      subtitle: 'Baro üyelerine özel indirimli kullanım seçenekleri.',
      badgeText: null,
      isFeatured: false,
      features: [
        'Baroya özel kampanya linki',
        'Aylık ve yıllık indirimli paketler',
        'Demo talebi oluşturma',
        'Toplu bilgilendirme desteği',
        'Kampanya bazlı takip imkanı',
      ],
      ctaText: 'Baro Kampanyası İçin Demo Talep Et',
      ctaTo: '/demo-talep',
      ctaExternal: false,
      isBaro: true,
    },
  ];
}

function getStaticPricingComparisonColumns(): PricingComparisonColumnView[] {
  return [
    {
      title: 'Manuel Excel',
      variant: 'negative',
      items: ['Formül hatası riski', 'Dosya karmaşası', 'Zaman kaybı'],
    },
    {
      title: 'Bilirkişi Hesap',
      variant: 'primary',
      items: [
        'Standart hesaplama akışı',
        'Tek panelde modüller',
        'Raporlanabilir sonuçlar',
      ],
    },
    {
      title: 'Profesyonel Kullanım',
      variant: 'positive',
      items: [
        'Hukuk dosyalarına uygun yapı',
        'Avukat ve bilirkişilere yönelik kullanım',
        'Hızlı demo ve abonelik',
      ],
    },
  ];
}

function getStaticPricingFaq(): PricingFaqItemView[] {
  return [
    {
      id: 'pricing-faq-1',
      question: 'Demo hesabı ücretli mi?',
      answer: 'Demo talebi oluşturduktan sonra ekip kısa süre içinde bilgileri paylaşır.',
    },
    {
      id: 'pricing-faq-2',
      question: 'Baro indirimi nasıl uygulanır?',
      answer:
        'Baroya özel kampanya bağlantısı üzerinden gelen kullanıcılar indirimli paketlerden yararlanabilir.',
    },
    {
      id: 'pricing-faq-3',
      question: 'Aylık ve yıllık paket arasında fark var mı?',
      answer: 'Erişim kapsamı aynıdır; yıllık paket uzun süreli kullanım için daha avantajlıdır.',
    },
    {
      id: 'pricing-faq-4',
      question: 'Ödeme sonrası hesap otomatik açılır mı?',
      answer:
        'Ödeme süreci tamamlandığında abonelik mevcut sistem üzerinden aktif edilir.',
    },
  ];
}

function mapPricingFaqFromCategories(categories: FaqCategoryView[]): PricingFaqItemView[] {
  const fiyat = categories.find((c) => c.id === 'fiyat');
  if (fiyat?.items.length) {
    return fiyat.items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    }));
  }
  return getStaticPricingFaq();
}

function mapApiPricingPlans(
  apiPlans: ContentBundleApi['pricing']['plans'],
): PricingPlanView[] {
  const staticPlans = getStaticPricingPlans();

  if (!apiPlans.length) {
    return staticPlans;
  }

  return apiPlans.map((plan) => {
    const staticPlan = staticPlans.find((p) => p.code === plan.code);
    const ctaTo = planCtaLink(plan.code, plan.ctaLink);
    const features =
      plan.features?.length > 0
        ? plan.features.map((f) => f.text)
        : (staticPlan?.features ?? []);

    return {
      code: plan.code,
      name: plan.name || staticPlan?.name || plan.code,
      priceDisplay: plan.priceDisplay ?? staticPlan?.priceDisplay ?? '',
      priceSuffix: plan.priceSuffix ?? staticPlan?.priceSuffix ?? null,
      subtitle: plan.subtitle ?? staticPlan?.subtitle ?? null,
      badgeText: plan.badgeText ?? staticPlan?.badgeText ?? null,
      isFeatured: plan.isFeatured ?? staticPlan?.isFeatured ?? false,
      features,
      ctaText: plan.ctaText ?? staticPlan?.ctaText ?? 'Abone Ol',
      ctaTo,
      ctaExternal: isExternalLink(ctaTo),
      isBaro: plan.code === 'baro',
    };
  });
}

function mapApiPricingComparisonColumns(
  columns: ContentBundleApi['pricing']['comparisonColumns'],
): PricingComparisonColumnView[] {
  const fallback = getStaticPricingComparisonColumns();
  if (!columns?.length) {
    return fallback;
  }

  const mapped = [...columns]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((col) => ({
      title: col.title,
      variant: normalizeComparisonVariant(col.variant),
      items: Array.isArray(col.items) && col.items.length > 0 ? col.items : [],
    }))
    .filter((col) => col.title && col.items.length > 0);

  return mapped.length > 0 ? mapped : fallback;
}

const DEFAULT_FOOTER_TAGLINE =
  'İş hukuku ve işçilik alacaklarında avukatlar ve bilirkişiler için profesyonel hesaplama altyapısı.';

const DEFAULT_FOOTER_NAV: FooterLinkView[] = [
  { title: 'Fiyatlandırma', href: '/fiyatlandirma' },
  { title: 'Demo Talep', href: '/demo-talep' },
  { title: 'SSS', href: '/sss' },
  { title: 'İletişim', href: '/iletisim' },
];

function resolveFooterView(
  pageContents: ContentBundleApi['pageContents'] | undefined,
  pageCards: ContentBundleApi['pageCards'] | undefined,
  contact: ContactView,
): FooterView {
  const fallback = getStaticFooter(contact);
  const layoutRows = (pageContents ?? []).filter((row) => row.pageKey === 'layout');
  const brand = layoutRows.find((row) => row.sectionKey === 'footer-brand');
  const copyright = layoutRows.find((row) => row.sectionKey === 'footer-copyright');

  const layoutGroup = (pageCards ?? []).find((g) => g.pageKey === 'layout');
  const navLinks =
    layoutGroup?.cards
      ?.filter((card) => card.isActive !== false && card.title && card.linkUrl)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((card) => ({
        title: card.title,
        href: normalizeContentPath(card.linkUrl ?? '/'),
      })) ?? fallback.navLinks;

  return {
    siteName: brand?.title?.trim() || fallback.siteName,
    tagline: brand?.description?.trim() || fallback.tagline,
    copyrightNote: copyright?.subtitle?.trim() || fallback.copyrightNote,
    navLinks: navLinks.length > 0 ? navLinks : fallback.navLinks,
    contactEmail: contact.setting.contactEmail ?? '',
    contactPhone: contact.setting.contactPhone ?? '',
    contactAddress: contact.setting.contactAddress ?? '',
  };
}

function getStaticFooter(contact?: ContactView): FooterView {
  const c = contact ?? getStaticContact();
  return {
    siteName: config.siteName,
    tagline: DEFAULT_FOOTER_TAGLINE,
    copyrightNote: 'Tüm hakları saklıdır.',
    navLinks: DEFAULT_FOOTER_NAV,
    contactEmail: c.setting.contactEmail ?? '',
    contactPhone: c.setting.contactPhone ?? '',
    contactAddress: c.setting.contactAddress ?? '',
  };
}

function planCtaLink(code: string, apiLink: string | null): string {
  if (apiLink) return apiLink;
  if (code === 'monthly') return config.PAYMENT_MONTHLY_URL;
  if (code === 'yearly') return config.PAYMENT_YEARLY_URL;
  if (code === 'baro') return '/demo-talep';
  return '/demo-talep';
}

export function getStaticContentBundle(): ContentBundleView {
  const calculationLandings = calculationPages.map(mapStaticCalculationPage);
  const faqCategories = mapStaticFaqCategories();
  const contact = getStaticContact();

  return {
    modules: staticModules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      href: m.href,
      icon: m.icon,
    })),
    calculationLandings,
    faqCategories,
    faqPreview: buildFaqPreview(faqCategories),
    pricingPlans: getStaticPricingPlans(),
    pricingComparisonTitle: PRICING_COMPARISON_TITLE,
    pricingComparisonColumns: getStaticPricingComparisonColumns(),
    pricingFaq: getStaticPricingFaq(),
    contact,
    demo: getStaticDemoPage(),
    footer: getStaticFooter(contact),
    seoByPath: {},
    pageContentsByPath: {},
    mediaAssets: [],
    mediaByKey: {},
    homepage: [],
    homepageByKey: {},
    trustMetrics: getStaticTrustMetrics(),
    ctaButtons: getStaticCtaButtons(),
    settings: {},
    branding: mapSiteBranding({}, {}),
  };
}

export function mapApiContentBundle(
  api: ContentBundleApi,
  publicBranding?: Partial<SiteBrandingView>,
): ContentBundleView {
  const faqCategories =
    (api.faq?.categories?.length ?? 0) > 0
      ? mapApiFaqCategories(api.faq!.categories)
      : mapStaticFaqCategories();
  const calculationLandings = (api.calculationModules ?? []).map(mapApiModuleToLanding);
  const mediaAssets = mapApiMediaAssets(api.mediaAssets);
  const contact = mapApiContact(api.contact);
  const homepage = mapApiHomepageSections(api.homepage);
  const settings = api.settings ?? {};

  return {
    modules: (api.calculationModules ?? []).map((m) => ({
      id: m.code,
      title: m.cardTitle,
      description: m.cardDescription ?? '',
      href: resolvePublicModulePath(m.slug),
      icon: resolveIcon(m.iconName),
    })),
    calculationLandings,
    faqCategories,
    faqPreview: buildFaqPreview(faqCategories),
    pricingPlans: mapApiPricingPlans(api.pricing?.plans ?? []),
    pricingComparisonTitle: PRICING_COMPARISON_TITLE,
    pricingComparisonColumns: mapApiPricingComparisonColumns(api.pricing?.comparisonColumns ?? []),
    pricingFaq: mapPricingFaqFromCategories(faqCategories),
    contact,
    demo: mapApiDemoPage(api),
    footer: resolveFooterView(api.pageContents, api.pageCards, contact),
    seoByPath: buildSeoByPath(api.seo ?? []),
    pageContentsByPath: buildPageContentsByPath(api.pageContents),
    mediaAssets,
    mediaByKey: buildMediaByKey(mediaAssets),
    homepage,
    homepageByKey: buildHomepageByKey(homepage),
    trustMetrics: (() => {
      const mapped = mapApiTrustMetrics(api.trustMetrics);
      return mapped.length > 0 ? mapped : getStaticTrustMetrics();
    })(),
    ctaButtons: (() => {
      const mapped = mapApiCtaButtons(api.ctaButtons);
      return mapped.length > 0 ? mapped : getStaticCtaButtons();
    })(),
    settings,
    branding: mapSiteBranding(settings, publicBranding),
  };
}

export async function fetchContentBundle(
  publicBranding?: Partial<SiteBrandingView>,
): Promise<ContentBundleView> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const raw = await apiGet<ContentBundleApi>(CONTENT_BUNDLE_PATH, controller.signal);
    return mapApiContentBundle(raw, publicBranding);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getContentBundleWithFallback(): Promise<{
  data: ContentBundleView;
  source: 'api' | 'static';
}> {
  try {
    const branding = await fetchPublicSiteBranding();
    const data = await fetchContentBundle(branding);
    if (!data.modules.length && !data.pricingPlans.length) {
      return { data: { ...getStaticContentBundle(), branding }, source: 'static' };
    }
    return { data, source: 'api' };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(
        '[content-bundle] API yüklenemedi — statik yedek kullanılıyor. Backend (3001) çalışıyor mu?',
        err,
      );
    }
    try {
      const branding = await fetchPublicSiteBranding();
      return { data: { ...getStaticContentBundle(), branding }, source: 'static' };
    } catch {
      return { data: getStaticContentBundle(), source: 'static' };
    }
  }
}
