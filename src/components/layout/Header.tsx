import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';
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

export function Header() {
  const { content } = useContentBundle();
  const logoSrc = content.branding.logoUrl || '/images/logo.png';
  const siteName =
    content.settings.site_name?.trim() || config.siteName;
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[15px] font-semibold transition-colors ${
      isActive ? 'text-sky-700' : 'text-slate-800 hover:text-slate-950'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-200 bg-white shadow-md">
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-6 lg:h-[4.5rem]">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src={logoSrc}
            alt={siteName}
            className="h-10 w-auto max-w-[10rem] object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.includes('/images/logo.png')) {
                img.style.display = 'none';
                return;
              }
              img.src = '/images/logo.png';
            }}
          />
          <span className="text-lg font-bold tracking-tight text-slate-900 lg:text-xl">
            {siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button to={config.PANEL_LOGIN_URL} variant="outline" size="md" external>
            <LogIn className="h-4 w-4" />
            Programa Giriş
          </Button>
          <Button to="/demo-talep" variant="accent" size="md">
            Demo Talep Et
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
              <Button to="/demo-talep" variant="accent" className="w-full">
                Demo Talep Et
              </Button>
              <Button to={config.PANEL_LOGIN_URL} variant="outline" className="w-full" external>
                Programa Giriş
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
