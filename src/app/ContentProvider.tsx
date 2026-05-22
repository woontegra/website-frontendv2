import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchPublicSiteBranding,
  getContentBundleWithFallback,
  getStaticContentBundle,
  isUsableBrandingLogoUrl,
  type ContentBundleView,
} from '@/lib/contentBundle';
import { readBrandingCache, writeBrandingCache } from '@/lib/brandingCache';

type ContentContextValue = {
  content: ContentBundleView;
  source: 'api' | 'static';
  /** CMS + marka bilgisi yüklendi (logo metin flaşı önlenir) */
  ready: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function applyBrandingToBundle(
  bundle: ContentBundleView,
  branding: { logoUrl: string; faviconUrl: string },
): ContentBundleView {
  return { ...bundle, branding };
}

function initialContent(): ContentBundleView {
  const base = getStaticContentBundle();
  const cached = readBrandingCache();
  if (!cached?.logoUrl || !isUsableBrandingLogoUrl(cached.logoUrl)) return base;
  return applyBrandingToBundle(base, {
    logoUrl: cached.logoUrl,
    faviconUrl: cached.faviconUrl?.trim() || base.branding.faviconUrl,
  });
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentBundleView>(initialContent);
  const [source, setSource] = useState<'api' | 'static'>('static');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([fetchPublicSiteBranding(), getContentBundleWithFallback()]).then(
      ([branding, result]) => {
        if (cancelled) return;
        setContent(applyBrandingToBundle(result.data, branding));
        setSource(result.source);
        setReady(true);
        if (isUsableBrandingLogoUrl(branding.logoUrl)) {
          writeBrandingCache(branding);
        }
        if (import.meta.env.DEV) {
          const heroCfg = result.data.homepageByKey?.hero?.config;
          const heroCount = Array.isArray(heroCfg?.heroImages)
            ? heroCfg.heroImages.length
            : heroCfg?.heroImage
              ? 1
              : 0;
          console.info('[content-bundle] kaynak:', result.source, 'heroSlides:', heroCount);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content, source, ready }), [content, source, ready]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContentBundle(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    return { content: getStaticContentBundle(), source: 'static', ready: false };
  }
  return ctx;
}
