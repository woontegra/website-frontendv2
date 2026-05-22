import { useEffect } from 'react';
import { useContentBundle } from '@/app/ContentProvider';

/** Genel ayarlardan favicon (ve isteğe bağlı başlık) — index.html varsayılanını günceller */
export function SiteDocumentHead() {
  const { content } = useContentBundle();
  const favicon = content.branding.faviconUrl;

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
