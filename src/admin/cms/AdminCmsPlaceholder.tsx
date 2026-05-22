import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/admin/ui/EmptyState';

type TechnicalLink = {
  to: string;
  label: string;
};

type AdminCmsPlaceholderProps = {
  title: string;
  description: string;
  technicalLinks?: TechnicalLink[];
};

export function AdminCmsPlaceholder({
  title,
  description,
  technicalLinks = [],
}: AdminCmsPlaceholderProps) {
  return (
    <EmptyState>
      <Construction className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-[1.1rem] font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-slate-600">{description}</p>
      <p className="mt-4 text-[15px] font-medium text-slate-700">
        Bu ekran bir sonraki adımda düzenlenecek.
      </p>
      {technicalLinks.length > 0 && (
        <div className="mt-6 border-t border-slate-200/80 pt-6">
          <p className="text-[13px] font-medium uppercase tracking-wide text-slate-500">
            Gelişmiş erişim
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {technicalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-[14px] font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </EmptyState>
  );
}
