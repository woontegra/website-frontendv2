import { apiRequest, type ApiError } from './apiClient';
import { getAdminToken } from './adminAuth';
import {
  parseLandingContent,
  type ModuleLandingContent,
} from '@/lib/calculationLandingContent';

const ADMIN_CONTENT_BUNDLE_PATH = '/api/admin/v2/content-bundle';

export type AdminSettingRow = {
  key: string;
  value: string | null;
  label: string | null;
};

const SETTING_LABELS: Record<string, string> = {
  site_name: 'Site adı',
  api_base_url: 'API taban URL',
  panel_login_url: 'Panel giriş URL',
  payment_monthly_url: 'Aylık ödeme URL',
  payment_yearly_url: 'Yıllık ödeme URL',
  youtube_url: 'YouTube URL',
  default_meta_description: 'Varsayılan meta açıklama',
};

function settingLabelForKey(key: string): string | null {
  return SETTING_LABELS[key] ?? null;
}

export function parseAdminSettings(bundle: AdminV2ContentBundle): AdminSettingRow[] {
  const raw = bundle.settings;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const key = typeof row.key === 'string' ? row.key : '';
        if (!key) return null;
        const value =
          row.value === null || row.value === undefined ? null : String(row.value);
        const label =
          (typeof row.label === 'string' && row.label) ||
          (typeof row.description === 'string' && row.description) ||
          settingLabelForKey(key);
        return { key, value, label };
      })
      .filter((row): row is AdminSettingRow => row !== null)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  return Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? null : String(value),
      label: settingLabelForKey(key),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export type AdminCalculationModuleRow = {
  id: string;
  code: string;
  title: string;
  cardTitle: string;
  cardDescription: string | null;
  slug: string;
  description: string | null;
  landingTitle: string | null;
  landingDescription: string | null;
  landingEyebrow: string | null;
  landingContent: ModuleLandingContent | null;
  benefits: string[];
  ctaText: string | null;
  iconName: string | null;
  sortOrder: number;
  publishStatus: string | null;
  isActive: boolean | null;
};

export function parseAdminCalculationModules(
  bundle: AdminV2ContentBundle,
): AdminCalculationModuleRow[] {
  const modules = bundle.calculationModules ?? [];

  return modules
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const code = typeof row.code === 'string' ? row.code : '';
      if (!code) return null;

      const cardTitle =
        (typeof row.cardTitle === 'string' && row.cardTitle) ||
        (typeof row.landingTitle === 'string' && row.landingTitle) ||
        code;
      const landingTitle =
        typeof row.landingTitle === 'string' ? row.landingTitle : cardTitle;
      const cardDescription =
        typeof row.cardDescription === 'string' ? row.cardDescription : null;
      const landingDescription =
        typeof row.landingDescription === 'string' ? row.landingDescription : cardDescription;
      const slug = typeof row.slug === 'string' ? row.slug : '';
      const benefits = Array.isArray(row.benefits)
        ? row.benefits.filter((b): b is string => typeof b === 'string')
        : [];

      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : code,
        code,
        title: cardTitle,
        cardTitle,
        cardDescription,
        slug,
        description: cardDescription ?? landingDescription,
        landingTitle,
        landingDescription,
        landingEyebrow: typeof row.landingEyebrow === 'string' ? row.landingEyebrow : null,
        landingContent: parseLandingContent(row.landingContent),
        benefits,
        ctaText: typeof row.ctaText === 'string' ? row.ctaText : null,
        iconName: typeof row.iconName === 'string' ? row.iconName : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
        publishStatus:
          typeof row.publishStatus === 'string' ? row.publishStatus : null,
        isActive: typeof row.isActive === 'boolean' ? row.isActive : null,
      };
    })
    .filter((row): row is AdminCalculationModuleRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}

export type AdminPricingPlanRow = {
  code: string;
  name: string;
  priceDisplay: string | null;
  period: string | null;
  description: string | null;
  features: string[];
  ctaText: string | null;
  ctaLink: string | null;
  isFeatured: boolean;
  sortOrder: number;
};

export type AdminPricingComparisonRow = {
  title: string;
  variant: string;
  items: string[];
  sortOrder: number;
};

export type AdminPricingData = {
  plans: AdminPricingPlanRow[];
  comparisonColumns: AdminPricingComparisonRow[];
};

export function parseAdminPricing(bundle: AdminV2ContentBundle): AdminPricingData {
  const rawPlans = bundle.pricing?.plans ?? [];
  const rawColumns = bundle.pricing?.comparisonColumns ?? [];

  const plans = rawPlans
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const code = typeof row.code === 'string' ? row.code : '';
      if (!code) return null;

      const featuresRaw = row.features;
      const features = Array.isArray(featuresRaw)
        ? featuresRaw
            .map((f) => {
              if (typeof f === 'string') return f;
              if (f && typeof f === 'object' && typeof (f as { text?: string }).text === 'string') {
                return (f as { text: string }).text;
              }
              return null;
            })
            .filter((t): t is string => Boolean(t))
        : [];

      return {
        code,
        name: typeof row.name === 'string' ? row.name : code,
        priceDisplay:
          typeof row.priceDisplay === 'string' ? row.priceDisplay : null,
        period: typeof row.priceSuffix === 'string' ? row.priceSuffix : null,
        description: typeof row.subtitle === 'string' ? row.subtitle : null,
        features,
        ctaText: typeof row.ctaText === 'string' ? row.ctaText : null,
        ctaLink: typeof row.ctaLink === 'string' ? row.ctaLink : null,
        isFeatured: Boolean(row.isFeatured),
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminPricingPlanRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));

  const comparisonColumns = rawColumns
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : '';
      if (!title) return null;

      const itemsRaw = row.items;
      const items = Array.isArray(itemsRaw)
        ? itemsRaw.filter((i): i is string => typeof i === 'string')
        : [];

      return {
        title,
        variant: typeof row.variant === 'string' ? row.variant : 'positive',
        items,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminPricingComparisonRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return { plans, comparisonColumns };
}

export type AdminFaqItemRow = {
  code: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type AdminFaqCategoryRow = {
  code: string;
  title: string;
  sortOrder: number;
  items: AdminFaqItemRow[];
};

export type AdminFaqData = {
  categories: AdminFaqCategoryRow[];
  totalCategories: number;
  totalQuestions: number;
};

export function parseAdminFaq(bundle: AdminV2ContentBundle): AdminFaqData {
  const rawCategories = bundle.faq?.categories ?? [];

  const categories = rawCategories
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const code = typeof row.code === 'string' ? row.code : '';
      const title = typeof row.title === 'string' ? row.title : '';
      if (!code && !title) return null;

      const rawItems = row.items;
      const items = Array.isArray(rawItems)
        ? rawItems
            .map((q) => {
              if (!q || typeof q !== 'object') return null;
              const item = q as Record<string, unknown>;
              const itemCode = typeof item.code === 'string' ? item.code : '';
              const question = typeof item.question === 'string' ? item.question : '';
              if (!question) return null;
              return {
                code: itemCode || question.slice(0, 32),
                question,
                answer: typeof item.answer === 'string' ? item.answer : '',
                sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
              };
            })
            .filter((q): q is AdminFaqItemRow => q !== null)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
        : [];

      return {
        code: code || title,
        title: title || code,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
        items,
      };
    })
    .filter((row): row is AdminFaqCategoryRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return {
    categories,
    totalCategories: categories.length,
    totalQuestions,
  };
}

export type AdminContactSettingView = {
  contactEmail: string | null;
  contactPhone: string | null;
  phoneNote: string | null;
  contactAddress: string | null;
  panelLoginUrl: string | null;
};

export type AdminSupportCardRow = {
  id: string;
  title: string;
  description: string | null;
  iconName: string | null;
  sortOrder: number;
};

export type AdminContactData = {
  setting: AdminContactSettingView | null;
  supportCards: AdminSupportCardRow[];
  totalSupportCards: number;
};

const CONTACT_SETTING_FIELDS: { key: keyof AdminContactSettingView; label: string }[] = [
  { key: 'contactEmail', label: 'E-posta' },
  { key: 'contactPhone', label: 'Telefon' },
  { key: 'phoneNote', label: 'Telefon notu' },
  { key: 'contactAddress', label: 'Adres' },
  { key: 'panelLoginUrl', label: 'Panel giriş URL' },
];

export function getAdminContactSettingRows(
  setting: AdminContactSettingView | null,
): { label: string; value: string | null }[] {
  if (!setting) return [];
  return CONTACT_SETTING_FIELDS.map(({ key, label }) => ({
    label,
    value: setting[key],
  }));
}

export function parseAdminContact(bundle: AdminV2ContentBundle): AdminContactData {
  const raw = bundle.contact;
  let setting: AdminContactSettingView | null = null;

  if (raw?.setting && typeof raw.setting === 'object') {
    const s = raw.setting as Record<string, unknown>;
    setting = {
      contactEmail: typeof s.contactEmail === 'string' ? s.contactEmail : null,
      contactPhone: typeof s.contactPhone === 'string' ? s.contactPhone : null,
      phoneNote: typeof s.phoneNote === 'string' ? s.phoneNote : null,
      contactAddress: typeof s.contactAddress === 'string' ? s.contactAddress : null,
      panelLoginUrl: typeof s.panelLoginUrl === 'string' ? s.panelLoginUrl : null,
    };
  }

  const supportCards = (raw?.supportCards ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : '';
      if (!title) return null;
      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : title,
        title,
        description: typeof row.description === 'string' ? row.description : null,
        iconName: typeof row.iconName === 'string' ? row.iconName : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminSupportCardRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return {
    setting,
    supportCards,
    totalSupportCards: supportCards.length,
  };
}

export type AdminMediaAssetRow = {
  id: string;
  assetKey: string;
  fileUrl: string | null;
  altText: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  title: string | null;
};

export function parseAdminMediaAssets(bundle: AdminV2ContentBundle): AdminMediaAssetRow[] {
  return (bundle.mediaAssets ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const assetKey = typeof row.assetKey === 'string' ? row.assetKey.trim() : '';
      if (!assetKey) return null;

      const fileUrl =
        (typeof row.fileUrl === 'string' && row.fileUrl.trim()) ||
        (typeof row.url === 'string' && row.url.trim()) ||
        null;

      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : assetKey,
        assetKey,
        fileUrl,
        altText: typeof row.altText === 'string' ? row.altText : null,
        mimeType: typeof row.mimeType === 'string' ? row.mimeType : null,
        width: typeof row.width === 'number' ? row.width : null,
        height: typeof row.height === 'number' ? row.height : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
        title: typeof row.title === 'string' ? row.title : null,
      };
    })
    .filter((row): row is AdminMediaAssetRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.assetKey.localeCompare(b.assetKey));
}

export type AdminPageContentRow = {
  id: string;
  pageKey: string;
  sectionKey: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  sortOrder: number;
};

export type AdminPageCardRow = {
  id: string;
  pageKey: string;
  cardKey: string;
  title: string | null;
  description: string | null;
  iconName: string | null;
  linkUrl: string | null;
  sortOrder: number;
};

export type AdminPageGroup = {
  pageKey: string;
  contents: AdminPageContentRow[];
  cards: AdminPageCardRow[];
};

export type AdminFooterNavCard = AdminPageCardRow & { isActive: boolean };

export type AdminFooterData = {
  brand: AdminPageContentRow & { isActive: boolean };
  copyright: AdminPageContentRow & { isActive: boolean };
  navCards: AdminFooterNavCard[];
};

export function parseAdminFooter(bundle: AdminV2ContentBundle): AdminFooterData | null {
  const findContent = (sectionKey: string) => {
    const row = (bundle.pageContents ?? []).find((item) => {
      if (!item || typeof item !== 'object') return false;
      const r = item as Record<string, unknown>;
      return r.pageKey === 'layout' && r.sectionKey === sectionKey;
    }) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id != null ? String(row.id) : `layout:${sectionKey}`,
      pageKey: 'layout',
      sectionKey,
      eyebrow: typeof row.eyebrow === 'string' ? row.eyebrow : null,
      title: typeof row.title === 'string' ? row.title : null,
      subtitle: typeof row.subtitle === 'string' ? row.subtitle : null,
      description: typeof row.description === 'string' ? row.description : null,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
    };
  };

  const brand = findContent('footer-brand');
  const copyright = findContent('footer-copyright');
  if (!brand || !copyright) return null;

  const layoutGroup = (bundle.pageCards ?? []).find((g) => {
    if (!g || typeof g !== 'object') return false;
    return (g as Record<string, unknown>).pageKey === 'layout';
  }) as Record<string, unknown> | undefined;

  const navCards: AdminFooterNavCard[] = [];
  const rawCards = Array.isArray(layoutGroup?.cards) ? layoutGroup.cards : [];
  for (const item of rawCards) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const cardKey = typeof row.cardKey === 'string' ? row.cardKey : '';
    if (!cardKey) continue;
    navCards.push({
      id: row.id != null ? String(row.id) : `layout:${cardKey}`,
      pageKey: 'layout',
      cardKey,
      title: typeof row.title === 'string' ? row.title : null,
      description: typeof row.description === 'string' ? row.description : null,
      iconName: typeof row.iconName === 'string' ? row.iconName : null,
      linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl : null,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
    });
  }

  navCards.sort((a, b) => a.sortOrder - b.sortOrder);
  return { brand, copyright, navCards };
}

export type AdminPagesData = {
  groups: AdminPageGroup[];
  totalContents: number;
  totalCards: number;
};

export function parseAdminPages(bundle: AdminV2ContentBundle): AdminPagesData {
  const contents = (bundle.pageContents ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const pageKey = typeof row.pageKey === 'string' ? row.pageKey : '';
      const sectionKey = typeof row.sectionKey === 'string' ? row.sectionKey : '';
      if (!pageKey || !sectionKey) return null;
      return {
        id:
          row.id !== undefined && row.id !== null
            ? String(row.id)
            : `${pageKey}:${sectionKey}`,
        pageKey,
        sectionKey,
        eyebrow: typeof row.eyebrow === 'string' ? row.eyebrow : null,
        title: typeof row.title === 'string' ? row.title : null,
        subtitle: typeof row.subtitle === 'string' ? row.subtitle : null,
        description: typeof row.description === 'string' ? row.description : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminPageContentRow => row !== null);

  const cardsByPage = new Map<string, AdminPageCardRow[]>();

  for (const group of bundle.pageCards ?? []) {
    if (!group || typeof group !== 'object') continue;
    const g = group as Record<string, unknown>;
    const pageKey = typeof g.pageKey === 'string' ? g.pageKey : '';
    if (!pageKey) continue;

    const rawCards = g.cards;
    const cards = Array.isArray(rawCards)
      ? rawCards
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Record<string, unknown>;
            const cardKey = typeof row.cardKey === 'string' ? row.cardKey : '';
            if (!cardKey) return null;
            return {
              id:
                row.id !== undefined && row.id !== null
                  ? String(row.id)
                  : `${pageKey}:${cardKey}`,
              pageKey,
              cardKey,
              title: typeof row.title === 'string' ? row.title : null,
              description: typeof row.description === 'string' ? row.description : null,
              iconName: typeof row.iconName === 'string' ? row.iconName : null,
              linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl : null,
              sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
            };
          })
          .filter((row): row is AdminPageCardRow => row !== null)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.cardKey.localeCompare(b.cardKey))
      : [];

    cardsByPage.set(pageKey, cards);
  }

  const pageKeys = new Set<string>();
  for (const c of contents) pageKeys.add(c.pageKey);
  for (const key of cardsByPage.keys()) pageKeys.add(key);

  const groups: AdminPageGroup[] = [...pageKeys]
    .sort((a, b) => a.localeCompare(b))
    .map((pageKey) => ({
      pageKey,
      contents: contents
        .filter((c) => c.pageKey === pageKey)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.sectionKey.localeCompare(b.sectionKey)),
      cards: cardsByPage.get(pageKey) ?? [],
    }));

  const totalCards = groups.reduce((sum, g) => sum + g.cards.length, 0);

  return {
    groups,
    totalContents: contents.length,
    totalCards,
  };
}

export type AdminSeoRow = {
  id: string;
  path: string;
  pageKey: string | null;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  sortOrder: number;
};

export function parseAdminSeo(bundle: AdminV2ContentBundle): AdminSeoRow[] {
  return (bundle.seo ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const path = typeof row.path === 'string' ? row.path : '';
      if (!path) return null;

      const pageKey =
        (typeof row.pageKey === 'string' && row.pageKey) ||
        (typeof row.page_key === 'string' && row.page_key) ||
        null;

      const canonicalUrl =
        (typeof row.canonicalUrl === 'string' && row.canonicalUrl) ||
        (typeof row.canonical_url === 'string' && row.canonical_url) ||
        null;

      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : path,
        path,
        pageKey,
        title: typeof row.title === 'string' ? row.title : null,
        description: typeof row.description === 'string' ? row.description : null,
        ogTitle: typeof row.ogTitle === 'string' ? row.ogTitle : null,
        ogDescription:
          typeof row.ogDescription === 'string' ? row.ogDescription : null,
        ogImage: typeof row.ogImage === 'string' ? row.ogImage : null,
        canonicalUrl,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminSeoRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.path.localeCompare(b.path));
}

export type AdminTrustMetricRow = {
  id: string;
  label: string;
  value: string;
  description: string | null;
  iconName: string | null;
  sortOrder: number;
};

export type AdminCtaButtonRow = {
  id: string;
  buttonKey: string;
  label: string;
  href: string | null;
  variant: string | null;
  pageKey: string | null;
  sectionKey: string | null;
  sortOrder: number;
};

export type AdminMarketingData = {
  trustMetrics: AdminTrustMetricRow[];
  ctaButtons: AdminCtaButtonRow[];
};

export function parseAdminMarketing(bundle: AdminV2ContentBundle): AdminMarketingData {
  const trustMetrics = (bundle.trustMetrics ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const label =
        (typeof row.labelText === 'string' && row.labelText) ||
        (typeof row.label === 'string' && row.label) ||
        '';
      const value =
        (typeof row.valueText === 'string' && row.valueText) ||
        (typeof row.value === 'string' && row.value) ||
        '';
      if (!label && !value) return null;
      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : `${value}-${label}`,
        label,
        value,
        description: typeof row.description === 'string' ? row.description : null,
        iconName: typeof row.iconName === 'string' ? row.iconName : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminTrustMetricRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  const ctaButtons = (bundle.ctaButtons ?? [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const buttonKey =
        (typeof row.code === 'string' && row.code) ||
        (typeof row.buttonKey === 'string' && row.buttonKey) ||
        (typeof row.key === 'string' && row.key) ||
        '';
      const label =
        (typeof row.label === 'string' && row.label) ||
        (typeof row.text === 'string' && row.text) ||
        '';
      if (!buttonKey && !label) return null;
      return {
        id: row.id !== undefined && row.id !== null ? String(row.id) : buttonKey || label,
        buttonKey: buttonKey || label,
        label: label || buttonKey,
        href:
          (typeof row.linkUrl === 'string' && row.linkUrl) ||
          (typeof row.href === 'string' && row.href) ||
          (typeof row.url === 'string' && row.url) ||
          null,
        variant: typeof row.variant === 'string' ? row.variant : null,
        pageKey:
          (typeof row.pageKey === 'string' && row.pageKey) ||
          (typeof row.page_key === 'string' && row.page_key) ||
          null,
        sectionKey:
          (typeof row.sectionKey === 'string' && row.sectionKey) ||
          (typeof row.section_key === 'string' && row.section_key) ||
          null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
      };
    })
    .filter((row): row is AdminCtaButtonRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.buttonKey.localeCompare(b.buttonKey));

  return { trustMetrics, ctaButtons };
}

export type AdminHomepageSectionRow = {
  id: string;
  sectionKey: string;
  title: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  description: string | null;
  config: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
};

export function parseAdminHomepageSections(bundle: AdminV2ContentBundle): AdminHomepageSectionRow[] {
  const raw = (bundle as { homepage?: unknown[] }).homepage ?? [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const sectionKey = typeof row.sectionKey === 'string' ? row.sectionKey : '';
      if (!sectionKey) return null;

      let config: Record<string, unknown> | null = null;
      if (row.config && typeof row.config === 'object') {
        config = row.config as Record<string, unknown>;
      } else if (typeof row.configJson === 'string') {
        try {
          const parsed = JSON.parse(row.configJson) as unknown;
          config = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
        } catch {
          config = null;
        }
      }

      return {
        id: row.id != null ? String(row.id) : sectionKey,
        sectionKey,
        title: typeof row.title === 'string' ? row.title : null,
        eyebrow: typeof row.eyebrow === 'string' ? row.eyebrow : null,
        subtitle: typeof row.subtitle === 'string' ? row.subtitle : null,
        description: typeof row.description === 'string' ? row.description : null,
        config,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
        isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
      };
    })
    .filter((row): row is AdminHomepageSectionRow => row !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.sectionKey.localeCompare(b.sectionKey));
}

export function getAdminHomepageSection(
  sections: AdminHomepageSectionRow[],
  sectionKey: string,
): AdminHomepageSectionRow | undefined {
  return sections.find((s) => s.sectionKey === sectionKey);
}

export type AdminV2ContentBundle = {
  settings?: Record<string, unknown> | AdminSettingRow[];
  homepage?: unknown[];
  calculationModules?: unknown[];
  pricing?: {
    plans?: unknown[];
    comparisonColumns?: unknown[];
  };
  faq?: {
    categories?: { items?: unknown[] }[];
  };
  contact?: {
    setting?: unknown | null;
    supportCards?: unknown[];
  };
  seo?: unknown[];
  pageContents?: unknown[];
  pageCards?: { pageKey?: string; cards?: unknown[] }[];
  mediaAssets?: unknown[];
  trustMetrics?: unknown[];
  ctaButtons?: unknown[];
};

export type AdminContentBundleSummary = {
  settings: number;
  modules: number;
  pricing: number;
  faq: number;
  contact: number;
  seo: number;
  pageContents: number;
  pageCards: number;
  mediaAssets: number;
};

export function summarizeAdminContentBundle(
  bundle: AdminV2ContentBundle,
): AdminContentBundleSummary {
  const faqCategories = bundle.faq?.categories ?? [];
  const faqItems = faqCategories.reduce(
    (sum, cat) => sum + (cat.items?.length ?? 0),
    0,
  );

  const pageCardGroups = bundle.pageCards ?? [];
  const pageCardCount = pageCardGroups.reduce(
    (sum, group) => sum + (group.cards?.length ?? 0),
    0,
  );

  const contactParts =
    (bundle.contact?.setting ? 1 : 0) + (bundle.contact?.supportCards?.length ?? 0);

  return {
    settings: Object.keys(bundle.settings ?? {}).length,
    modules: bundle.calculationModules?.length ?? 0,
    pricing:
      (bundle.pricing?.plans?.length ?? 0) +
      (bundle.pricing?.comparisonColumns?.length ?? 0),
    faq: faqCategories.length + faqItems,
    contact: contactParts,
    seo: bundle.seo?.length ?? 0,
    pageContents: bundle.pageContents?.length ?? 0,
    pageCards: pageCardCount,
    mediaAssets: bundle.mediaAssets?.length ?? 0,
  };
}

export async function fetchAdminV2ContentBundle(): Promise<AdminV2ContentBundle> {
  const token = getAdminToken();
  if (!token) {
    const error: ApiError = {
      status: 401,
      message:
        'Admin oturumu bulunamadı. Giriş yaptıktan sonra tarayıcıda localStorage içinde "token" anahtarı olmalıdır.',
    };
    throw error;
  }

  return apiRequest<AdminV2ContentBundle>(ADMIN_CONTENT_BUNDLE_PATH, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
