import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
import {
  isExternalNavHref,
  isUsableBrandingLogoUrl,
  resolveHomepageHeroCtaButtons,
  resolvePanelLoginCta,
} from '@/lib/contentBundle';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/Button';

const navItems = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/satin-al', label: 'Satın Al' },
  { to: '/fiyatlandirma', label: 'Fiyatlandırma' },
  { to: '/demo-talep', label: 'Demo Talep' },
  { to: '/sss', label: 'SSS' },
  { to: '/iletisim', label: 'İletişim' },
];

const LOGO_BOX_CLASS = 'flex h-10 min-w-[8rem] max-w-[14rem] items-center sm:h-11 sm:min-w-[9rem]';

export function Header() {
  const { content, ready } = useContentBundle();
  const logoSrc = content.branding.logoUrl?.trim() ?? '';
  const showLogo = isUsableBrandingLogoUrl(logoSrc);
  const siteName = content.settings.site_name?.trim() || config.siteName;
  const heroCtas = resolveHomepageHeroCtaButtons(content);
  const demoCta = heroCtas.find((b) => b.code === 'hero_demo');
  const panelLogin = resolvePanelLoginCta(content);
  const demoHref = demoCta?.href ?? '/demo-talep';
  const demoLabel = demoCta?.label ?? 'Demo Talep Et';
  const loginHref = panelLogin.href;
  const loginLabel = panelLogin.label;
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
    setLogoLoaded(false);
  }, [logoSrc]);

  useEffect(() => {
    if (!showLogo || !logoSrc) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = logoSrc;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [logoSrc, showLogo]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[15px] font-semibold transition-colors ${
      isActive ? 'text-sky-700' : 'text-slate-800 hover:text-slate-950'
    }`;

  const logoMark = () => {
    if (showLogo && !logoFailed) {
      return (
        <span className={`${LOGO_BOX_CLASS} relative`}>
          <span
            className={`h-9 w-[8.5rem] rounded-md bg-slate-200/90 transition-opacity sm:h-10 sm:w-[9.5rem] ${
              logoLoaded ? 'opacity-0' : 'animate-pulse opacity-100'
            }`}
            aria-hidden
          />
          <img
            src={logoSrc}
            alt={siteName}
            width={224}
            height={44}
            decoding="async"
            fetchPriority="high"
            className={`absolute inset-0 m-auto max-h-10 w-auto max-w-[14rem] object-contain transition-opacity duration-200 sm:max-h-11 ${
              logoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLogoLoaded(true)}
            onError={() => {
              setLogoFailed(true);
              setLogoLoaded(false);
            }}
          />
        </span>
      );
    }

    if (!ready) {
      return (
        <span className={LOGO_BOX_CLASS} aria-hidden>
          <span className="h-9 w-[8.5rem] animate-pulse rounded-md bg-slate-200/90 sm:h-10 sm:w-[9.5rem]" />
        </span>
      );
    }

    return (
      <span className="text-lg font-bold tracking-tight text-slate-900 lg:text-xl">{siteName}</span>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-200 bg-white shadow-md">
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-6 lg:h-[4.5rem]">
        <Link to="/" className="flex shrink-0 items-center">
          {logoMark()}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            to={loginHref}
            variant="outline"
            size="md"
            external={panelLogin.external}
          >
            <LogIn className="h-4 w-4" />
            {loginLabel}
          </Button>
          <Button to={demoHref} variant="accent" size="md" external={isExternalNavHref(demoHref)}>
            {demoLabel}
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2.5 text-slate-900 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menü"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-base font-semibold ${
                    isActive ? 'bg-slate-100 text-sky-800' : 'text-slate-800'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button
                to={demoHref}
                variant="accent"
                className="w-full"
                external={isExternalNavHref(demoHref)}
              >
                {demoLabel}
              </Button>
              <Button
                to={loginHref}
                variant="outline"
                className="w-full"
                external={panelLogin.external}
              >
                {loginLabel}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
