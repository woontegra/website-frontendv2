import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useContentBundle } from '@/app/ContentProvider';

export function Footer() {
  const { content } = useContentBundle();
  const { footer } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700 bg-slate-900 text-slate-200">
      <div className="container-page grid gap-12 py-14 md:grid-cols-3 lg:gap-16">
        <div>
          <p className="text-xl font-bold text-white">{footer.siteName}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{footer.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-white">Sayfalar</p>
          <ul className="mt-4 space-y-2.5 text-sm font-medium">
            {footer.navLinks.map((link) => (
              <li key={`${link.href}-${link.title}`}>
                <Link to={link.href} className="text-slate-200 hover:text-white">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-white">İletişim</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{footer.contactEmail}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{footer.contactPhone}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{footer.contactAddress}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-700 py-5 text-center text-sm text-slate-400">
        © {year} {footer.siteName}. {footer.copyrightNote}
      </div>
    </footer>
  );
}
