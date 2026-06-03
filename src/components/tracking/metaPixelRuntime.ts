declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function trackMetaPageView(): void {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

function clearMetaCookies(): void {
  const hostParts = window.location.hostname.split('.');
  const domains: (string | undefined)[] = [undefined, window.location.hostname];
  if (hostParts.length > 1) {
    domains.push(`.${hostParts.slice(-2).join('.')}`);
  }

  const names = new Set<string>();
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0]?.trim();
    if (name && (name === '_fbp' || name === '_fbc' || name.startsWith('_fbp') || name.startsWith('_fbc'))) {
      names.add(name);
    }
  });

  for (const name of names) {
    for (const domain of domains) {
      const domainPart = domain ? `;domain=${domain}` : '';
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/${domainPart}`;
    }
  }
}

function removeMetaPixelFromDom(): void {
  document
    .querySelectorAll('script[data-meta-pixel], script[src*="fbevents.js"]')
    .forEach((el) => el.remove());
  document.querySelectorAll('noscript[data-meta-pixel]').forEach((el) => el.remove());

  try {
    delete window.fbq;
    delete window._fbq;
  } catch {
    window.fbq = undefined;
    window._fbq = undefined;
  }
}

export function injectMetaPixel(pixelId: string): void {
  const id = pixelId.trim();
  if (!id) return;

  if (typeof window.fbq === 'function') {
    trackMetaPageView();
    return;
  }

  if (
    document.querySelector(`script[data-meta-pixel="${id}"]`) ||
    document.querySelector('script[src*="fbevents.js"]')
  ) {
    trackMetaPageView();
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('data-meta-pixel', id);
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${id.replace(/'/g, "\\'")}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  if (!document.querySelector(`noscript[data-meta-pixel="${id}"]`)) {
    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-meta-pixel', id);
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }
}

export function revokeMetaPixel(): void {
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('consent', 'revoke');
    } catch {
      /* ignore */
    }
  }
  clearMetaCookies();
  removeMetaPixelFromDom();
}
