import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { AdminPageIntro } from '@/admin/cms/AdminPageIntro';
import { AdminSectionCard } from '@/admin/cms/AdminSectionCard';

export function AdminV2DemoPage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Demo talep sayfası"
        description="Demo sayfası metinleri SSS içindeki «demo» kategorisi ve site ayarları ile beslenir."
      />
      <AdminSectionCard title="İçerik kaynağı" description="Demo metinlerini nereden düzenlersiniz?">
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
          <li>
            <Link to="/admin/v2/faq" className="font-semibold text-emerald-700 hover:underline">
              SSS Yönetimi
            </Link>{' '}
            — <code className="rounded bg-slate-100 px-1 text-xs">demo</code> kodlu kategori
          </li>
          <li>
            <Link to="/admin/v2/overview" className="font-semibold text-emerald-700 hover:underline">
              Genel Bakış → Site Ayarları
            </Link>{' '}
            — site adı ve iletişim alanları
          </li>
        </ul>
        <a
          href="/demo-talep"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
        >
          Canlı demo sayfasını aç
          <ExternalLink className="h-4 w-4" />
        </a>
      </AdminSectionCard>
    </div>
  );
}
