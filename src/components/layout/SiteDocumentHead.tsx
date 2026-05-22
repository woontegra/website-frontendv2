import { useEffect } from 'react';
import { useContentBundle } from '@/app/ContentProvider';
import { useRouteSeo } from '@/lib/pageSeo';

/** Site favicon + aktif sayfa SEO (v2_seo_pages → document head). */
export function SiteDocumentHead() {
  const { content } = useContentBundle();
  const favicon = content.branding.faviconUrl;

  useRouteSeo(content);

  useEffect(() => {
    if (!favicon) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link.href !== favicon) {
      link.href = favicon;
    }
    if (favicon.endsWith('.svg')) {
      link.type = 'image/svg+xml';
    } else if (favicon.endsWith('.png')) {
      link.type = 'image/png';
    }
  }, [favicon]);

  return null;
}
