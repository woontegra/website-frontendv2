import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ContentBundleView, SeoPageView } from '@/lib/contentBundle';
import { normalizeContentPath } from '@/lib/contentBundle';
import { resolvePublicAssetUrl } from '@/lib/resolvePublicAssetUrl';

function upsertMetaElement(
  selector: string,
  create: () => HTMLMetaElement,
  content: string,
): void {
  if (!content.trim()) return;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** CMS SEO kayıtlarını document head'e uygular (UTF-8 düz metin, ek decode yok). */
export function applyDocumentSeo(
  seo: SeoPageView | undefined,
  options?: { defaultTitle?: string; defaultDescription?: string },
): void {
  const title = seo?.title?.trim() || options?.defaultTitle?.trim();
  const description = seo?.description?.trim() || options?.defaultDescription?.trim();
  const ogTitle = seo?.ogTitle?.trim() || title;
  const ogDescription = seo?.ogDescription?.trim() || description;
  const ogImage = seo?.ogImage?.trim();

  if (title) {
    document.title = title;
  }

  if (description) {
    upsertMetaElement(
      'meta[name="description"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        return meta;
      },
      description,
    );
  }

  if (ogTitle) {
    upsertMetaElement(
      'meta[property="og:title"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        return meta;
      },
      ogTitle,
    );
  }

  if (ogDescription) {
    upsertMetaElement(
      'meta[property="og:description"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        return meta;
      },
      ogDescription,
    );
  }

  if (ogImage) {
    const resolved = resolvePublicAssetUrl(ogImage);
    upsertMetaElement(
      'meta[property="og:image"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        return meta;
      },
      resolved,
    );
  }

  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (seo?.noIndex) {
    upsertMetaElement(
      'meta[name="robots"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        return meta;
      },
      'noindex, nofollow',
    );
  } else if (robots?.getAttribute('content')?.includes('noindex')) {
    robots.remove();
  }
}

export function usePageSeo(
  content: ContentBundleView,
  path: string,
  defaults?: { title?: string; description?: string },
): void {
  const normalized = normalizeContentPath(path);
  const seo = content.seoByPath[normalized];

  useEffect(() => {
    applyDocumentSeo(
      seo,
      defaults
        ? {
            defaultTitle: defaults.title,
            defaultDescription: defaults.description,
          }
        : undefined,
    );
  }, [seo, defaults?.title, defaults?.description, normalized]);
}

export function useRouteSeo(
  content: ContentBundleView,
  defaults?: { title?: string; description?: string },
): void {
  const { pathname } = useLocation();
  usePageSeo(content, pathname, defaults);
}
